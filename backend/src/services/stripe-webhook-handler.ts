import { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import Stripe from "stripe"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../modules/subscription-infrastructure/service"
import deleteSubscriptionInfrastructureWorkflow from "../workflows/delete-subscription-infrastructure"
import provisionSubscriptionInfrastructureWorkflow from "../workflows/provision-subscription-infrastructure"

type HetznerPlanConfig = {
  server_type: string
  image: string
  location: string
}

type ResolveContainer = {
  resolve: <T = unknown>(key: string) => T
}

const checkoutSubscriptionByCustomer = new Map<string, string>()

const getStripeCustomerId = (
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined
): string | undefined => {
  if (typeof value === "string") {
    return value
  }

  if (value && typeof value === "object" && "id" in value && typeof value.id === "string") {
    return value.id
  }

  return undefined
}

const getStripeSubscriptionIdFromInvoice = (invoice: Stripe.Invoice): string | undefined => {
  const subscriptionId =
    typeof invoice.subscription === "string"
      ? invoice.subscription
      : invoice.subscription?.id

  return subscriptionId || undefined
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

  logger.info(
    `[stripe-webhook] resolved plan mapping stripe_price_id=${stripePriceId} server_type=${config?.server_type || "n/a"} image=${config?.image || "n/a"} location=${config?.location || "n/a"}`
  )

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
  container: ResolveContainer,
  event: Stripe.Event,
  invoice: Stripe.Invoice,
  logger: Logger
) => {
  const rawSubscriptionValue = invoice.subscription
  const extractedSubscriptionId = getStripeSubscriptionIdFromInvoice(invoice)
  const invoiceCustomerId = getStripeCustomerId(invoice.customer)
  const fallbackSubscriptionId =
    !extractedSubscriptionId && invoiceCustomerId
      ? checkoutSubscriptionByCustomer.get(invoiceCustomerId)
      : undefined
  const stripeSubscriptionId = extractedSubscriptionId || fallbackSubscriptionId
  const usedFallbackMapping = !extractedSubscriptionId && !!fallbackSubscriptionId

  logger.info(`[stripe-webhook] invoice.payment_succeeded invoice_id=${invoice.id}`)
  logger.info(
    `[stripe-webhook] invoice.subscription raw=${typeof rawSubscriptionValue === "string" ? rawSubscriptionValue : JSON.stringify(rawSubscriptionValue)}`
  )
  logger.info(
    `[stripe-webhook] invoice.subscription extracted subscription_id=${extractedSubscriptionId || "n/a"}`
  )
  logger.info(
    `[stripe-webhook] invoice.subscription fallback_mapping_used=${usedFallbackMapping} customer_id=${invoiceCustomerId || "n/a"}`
  )

  if (!stripeSubscriptionId) {
    logger.warn(
      `[stripe-webhook] ${event.type} ${event.id} has no subscription id invoice_id=${invoice.id}`
    )
    return
  }

  logger.info(
    `[stripe-webhook] resolved Stripe subscription ID subscription_id=${stripeSubscriptionId} event_type=${event.type} event_id=${event.id}`
  )

  const query = container.resolve<any>(ContainerRegistrationKeys.QUERY)
  const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  const resolved = await resolveOrderDataFromStripeSubscription(query, stripeSubscriptionId)

  if (!resolved) {
    logger.warn(
      `[stripe-webhook] Could not resolve order data for stripe subscription ${stripeSubscriptionId}`
    )
    return
  }

  logger.info(
    `[stripe-webhook] resolved Medusa order ID order_id=${resolved.orderId} subscription_id=${stripeSubscriptionId}`
  )

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

  if (
    ["active", "provisioning", "deleting", "deleted"].includes(
      String(infrastructure.status || "")
    )
  ) {
    logger.info(
      `[stripe-webhook] Skipping provisioning for infrastructure ${infrastructure.id} with status ${infrastructure.status}`
    )
    return
  }

  logger.info(`[stripe-webhook] provisioning workflow start infrastructure_id=${infrastructure.id}`)

  await provisionSubscriptionInfrastructureWorkflow(container as any).run({
    input: {
      infrastructure_id: infrastructure.id,
    },
  })
}

const handleSubscriptionEnded = async (
  container: ResolveContainer,
  stripeSubscriptionId: string,
  logger: Logger
) => {
  const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
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

    logger.info(`[stripe-webhook] deletion workflow start infrastructure_id=${infrastructure.id}`)

    await deleteSubscriptionInfrastructureWorkflow(container as any).run({
      input: {
        infrastructure_id: infrastructure.id,
      },
    })
  }
}

export const processStripeWebhookEvent = async ({
  container,
  event,
  logger,
}: {
  container: ResolveContainer
  event: Stripe.Event
  logger: Logger
}) => {
  const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  if (await wasEventProcessed(infraService, event.id)) {
    logger.info(`[stripe-webhook] Ignoring duplicate event ${event.id}`)
    return { duplicate: true }
  }

  logger.info(`[stripe-webhook] Stripe event type=${event.type} id=${event.id}`)

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const sessionCustomerId = getStripeCustomerId(session.customer)
      const sessionSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id

      if (sessionCustomerId && sessionSubscriptionId) {
        checkoutSubscriptionByCustomer.set(sessionCustomerId, sessionSubscriptionId)
      }

      logger.info(
        `[stripe-webhook] checkout.session.completed id=${session.id} customer=${sessionCustomerId || "n/a"} subscription=${sessionSubscriptionId || "n/a"}`
      )
      break
    }

    case "invoice.paid": {
      await handleInvoicePaid(container, event, event.data.object as Stripe.Invoice, logger)
      break
    }

    case "invoice.payment_succeeded": {
      await handleInvoicePaid(container, event, event.data.object as Stripe.Invoice, logger)
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
        await handleSubscriptionEnded(container, subscription.id, logger)
      }
      break
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      await handleSubscriptionEnded(container, subscription.id, logger)
      break
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      const stripeSubscriptionId = getStripeSubscriptionIdFromInvoice(invoice)

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

  return { duplicate: false }
}
