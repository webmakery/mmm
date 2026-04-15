import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import SubscriptionInfrastructureModuleService from "../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../modules/subscription-infrastructure"
import provisionSubscriptionInfrastructureWorkflow from "../../../workflows/provision-subscription-infrastructure"
import deleteSubscriptionInfrastructureWorkflow from "../../../workflows/delete-subscription-infrastructure"

type HetznerPlanConfig = {
  server_type: string
  image: string
  location: string
}

const parsePlanMapping = (): Record<string, HetznerPlanConfig> => {
  const raw = process.env.HETZNER_PLAN_MAPPING || "{}"

  try {
    return JSON.parse(raw) as Record<string, HetznerPlanConfig>
  } catch {
    throw new Error("Invalid HETZNER_PLAN_MAPPING JSON")
  }
}

const sanitizeNamePart = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, "-")
const pickFirst = <T>(result: T | T[]): T => (Array.isArray(result) ? result[0] : result)

const resolveOrderDataFromStripeSubscription = async (
  query: any,
  stripeSubscriptionId: string
) => {
  const { data: subscriptions } = await query.graph({
    entity: "subscription",
    fields: [
      "id",
      "metadata",
      "customer.id",
      "stripe_customer_id",
      "stripe_subscription_id",
      "stripe_price_id",
      "orders.id",
    ],
    filters: {
      stripe_subscription_id: [stripeSubscriptionId],
    },
  })

  const subscription = subscriptions[0]

  if (!subscription) {
    return null
  }

  const mainOrderId =
    (subscription.metadata as Record<string, string> | null)?.main_order_id ||
    subscription.orders?.[0]?.id

  if (!mainOrderId) {
    return null
  }

  return {
    subscription,
    orderId: String(mainOrderId),
    customerId: String(subscription.customer?.id || "unknown"),
    stripeCustomerId: String(subscription.stripe_customer_id || ""),
    stripePriceId: String(subscription.stripe_price_id || ""),
  }
}

const findInfrastructureRecord = async (
  infraService: SubscriptionInfrastructureModuleService,
  orderId: string,
  stripeSubscriptionId: string
) => {
  const [record] = await infraService.listSubscriptionInfrastructures({
    order_id: orderId,
    stripe_subscription_id: stripeSubscriptionId,
  })

  return record
}

const ensureInfrastructureRecord = async ({
  infraService,
  orderId,
  customerId,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeInvoiceId,
  stripePriceId,
  logger,
}: {
  infraService: SubscriptionInfrastructureModuleService
  orderId: string
  customerId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  stripeInvoiceId?: string
  stripePriceId: string
  logger: Logger
}) => {
  const planMap = parsePlanMapping()
  const config = planMap[stripePriceId]

  if (!config) {
    throw new Error(`No Hetzner plan mapping for Stripe price '${stripePriceId}'`)
  }

  const existing = await findInfrastructureRecord(infraService, orderId, stripeSubscriptionId)

  if (existing) {
    if (stripeInvoiceId && existing.stripe_invoice_id !== stripeInvoiceId) {
      await infraService.updateSubscriptionInfrastructures({
        id: existing.id,
        stripe_invoice_id: stripeInvoiceId,
      })
    }

    return existing
  }

  const serverName = `cust-${sanitizeNamePart(customerId)}-order-${sanitizeNamePart(orderId)}`

  const created = pickFirst(
    await infraService.createSubscriptionInfrastructures({
    order_id: orderId,
    customer_id: customerId,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_invoice_id: stripeInvoiceId ?? null,
    hetzner_server_id: null,
    hetzner_server_name: serverName,
    hetzner_region: config.location,
    hetzner_server_type: config.server_type,
    hetzner_image: config.image,
    status: "pending",
    last_error: null,
  })
  )

  logger.info(
    `[stripe-webhook] Created subscription_infrastructure ${created.id} for order ${orderId}`
  )

  return created
}

const markEventProcessed = async (
  infraService: SubscriptionInfrastructureModuleService,
  event: Stripe.Event
) => {
  try {
    await infraService.createStripeWebhookEvents({
      event_id: event.id,
      event_type: event.type,
      processed_at: new Date(),
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : ""
    if (!message.toLowerCase().includes("duplicate")) {
      throw e
    }
  }
}

const wasEventProcessed = async (
  infraService: SubscriptionInfrastructureModuleService,
  eventId: string
) => {
  const [event] = await infraService.listStripeWebhookEvents({ event_id: eventId })
  return !!event
}

const handleInvoicePaid = async (
  req: MedusaRequest,
  event: Stripe.Event,
  invoice: Stripe.Invoice,
  logger: Logger
) => {
  const stripeSubscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id

  if (!stripeSubscriptionId) {
    logger.warn(`[stripe-webhook] invoice.paid ${event.id} has no subscription id`)
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  const resolved = await resolveOrderDataFromStripeSubscription(query, stripeSubscriptionId)

  if (!resolved) {
    logger.warn(
      `[stripe-webhook] Could not resolve order data for stripe subscription ${stripeSubscriptionId}`
    )
    return
  }

  const infrastructure = await ensureInfrastructureRecord({
    infraService,
    orderId: resolved.orderId,
    customerId: resolved.customerId,
    stripeCustomerId: resolved.stripeCustomerId,
    stripeSubscriptionId,
    stripeInvoiceId: invoice.id,
    stripePriceId: resolved.stripePriceId,
    logger,
  })

  if (["active", "provisioning", "deleting", "deleted"].includes(infrastructure.status)) {
    logger.info(
      `[stripe-webhook] Skipping provisioning for infrastructure ${infrastructure.id} with status ${infrastructure.status}`
    )
    return
  }

  await provisionSubscriptionInfrastructureWorkflow(req.scope).run({
    input: {
      infrastructure_id: infrastructure.id,
    },
  })
}

const handleSubscriptionEnded = async (
  req: MedusaRequest,
  stripeSubscriptionId: string,
  logger: Logger
) => {
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  const infrastructures = await infraService.listSubscriptionInfrastructures({
    stripe_subscription_id: stripeSubscriptionId,
  })

  for (const infrastructure of infrastructures) {
    if (infrastructure.status === "deleted") {
      logger.info(
        `[stripe-webhook] Infrastructure ${infrastructure.id} already deleted for subscription ${stripeSubscriptionId}`
      )
      continue
    }

    await deleteSubscriptionInfrastructureWorkflow(req.scope).run({
      input: {
        infrastructure_id: infrastructure.id,
      },
    })
  }
}

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger") as Logger
  const stripeApiKey = process.env.STRIPE_API_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!stripeApiKey || !stripeWebhookSecret) {
    res.status(500).json({
      message: "Missing STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET configuration.",
    })
    return
  }

  const stripe = new Stripe(stripeApiKey)

  const signature = req.headers["stripe-signature"]

  if (!signature || Array.isArray(signature)) {
    res.status(400).json({ message: "Missing stripe-signature header." })
    return
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}))

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown signature verification error"
    logger.error(`[stripe-webhook] Signature verification failed: ${message}`)
    res.status(400).json({ message: "Invalid Stripe webhook signature." })
    return
  }

  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  if (await wasEventProcessed(infraService, event.id)) {
    logger.info(`[stripe-webhook] Ignoring duplicate event ${event.id}`)
    res.status(200).json({ received: true, duplicate: true })
    return
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        logger.info(
          `[stripe-webhook] checkout.session.completed id=${session.id} subscription=${session.subscription}`
        )
        break
      }

      case "invoice.paid": {
        await handleInvoicePaid(req, event, event.data.object as Stripe.Invoice, logger)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription

        if (subscription.cancel_at_period_end) {
          logger.info(
            `[stripe-webhook] Subscription ${subscription.id} set to cancel_at_period_end. Deferring deletion.`
          )
          break
        }

        if (subscription.ended_at || subscription.status === "canceled") {
          await handleSubscriptionEnded(req, subscription.id, logger)
        }
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionEnded(req, subscription.id, logger)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const stripeSubscriptionId =
          typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription?.id

        if (stripeSubscriptionId) {
          const infrastructures = await infraService.listSubscriptionInfrastructures({
            stripe_subscription_id: stripeSubscriptionId,
          })

          await Promise.all(
            infrastructures.map((record) =>
              infraService.updateSubscriptionInfrastructures({
                id: record.id,
                status: "failed",
                stripe_invoice_id: invoice.id,
                last_error: `Invoice payment failed (${invoice.id})`,
              })
            )
          )
        }

        logger.warn(`[stripe-webhook] invoice.payment_failed invoice=${invoice.id}`)
        break
      }

      default:
        logger.info(`[stripe-webhook] Unhandled event type ${event.type}`)
    }

    await markEventProcessed(infraService, event)
    res.status(200).json({ received: true })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown webhook processing error"
    logger.error(`[stripe-webhook] Failed to process event ${event.id}: ${message}`)
    res.status(500).json({ message })
  }
}
