import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createCustomersWorkflow } from "@medusajs/core-flows"
import { z } from "zod"
import Stripe from "stripe"
import SubscriptionModuleService from "../../../../../../modules/subscription/service"
import { SUBSCRIPTION_MODULE } from "../../../../../../modules/subscription"
import {
  SubscriptionInterval,
} from "../../../../../../modules/subscription/types"
import {
  mapStripeStatusToDisplayStatus,
  mapStripeStatusToInternalStatus,
} from "../../../../../../modules/subscription/utils/stripe-status"

export const PostStoreSyncSubscriptionSchema = z.object({ session_id: z.string().min(1) })

export const POST = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof PostStoreSyncSubscriptionSchema>>,
  res: MedusaResponse
) => {
  const actorId = req.auth_context?.actor_id

  const stripeApiKey = process.env.STRIPE_API_KEY

  if (!stripeApiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing STRIPE_API_KEY configuration."
    )
  }

  const stripe = new Stripe(stripeApiKey)
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)

  let checkoutSession: Stripe.Checkout.Session

  try {
    checkoutSession = await stripe.checkout.sessions.retrieve(
      req.validatedBody.session_id,
      {
        expand: ["subscription", "customer"],
      }
    )
  } catch (error) {
    logger.error(
      `Unable to retrieve Stripe checkout session ${req.validatedBody.session_id}`,
      error
    )
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "We could not verify this checkout session. Please refresh and try again."
    )
  }

  if (checkoutSession.mode !== "subscription") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Checkout session is not a subscription session."
    )
  }

  const metadataCustomerId = checkoutSession.metadata?.customer_id
  if (actorId && metadataCustomerId && metadataCustomerId !== actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You are not allowed to sync this subscription."
    )
  }

  const stripeSubscription = checkoutSession.subscription

  if (!stripeSubscription || typeof stripeSubscription === "string") {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No Stripe subscription found for this checkout session."
    )
  }

  const stripeSubscriptionId = stripeSubscription.id

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const link = req.scope.resolve(ContainerRegistrationKeys.LINK)

  const checkoutEmail =
    checkoutSession.customer_details?.email ||
    (checkoutSession.customer &&
    typeof checkoutSession.customer === "object" &&
    "email" in checkoutSession.customer
      ? checkoutSession.customer.email || undefined
      : undefined) ||
    checkoutSession.metadata?.customer_email

  const resolveCustomerId = async (): Promise<string> => {
    if (actorId) {
      return actorId
    }

    if (!checkoutEmail) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "An email address is required to complete subscription setup."
      )
    }

    const { data: existingCustomers } = await query.graph({
      entity: "customer",
      fields: ["id"],
      filters: { email: [checkoutEmail] },
    })

    if (existingCustomers.length) {
      return existingCustomers[0].id
    }

    const firstName =
      checkoutSession.customer_details?.name?.split(" ").slice(0, -1).join(" ") ||
      undefined
    const lastName =
      checkoutSession.customer_details?.name?.split(" ").slice(-1).join(" ") ||
      undefined

    let customerResult: { result?: Array<{ id?: string }> }

    try {
      customerResult = await createCustomersWorkflow(req.scope).run({
        input: {
          customersData: [
            {
              email: checkoutEmail,
              first_name: firstName,
              last_name: lastName,
              phone: checkoutSession.customer_details?.phone || undefined,
              has_account: false,
            },
          ],
        },
      })
    } catch (error) {
      logger.warn(
        `Customer creation during subscription sync failed for ${checkoutEmail}, retrying lookup. ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )

      const { data: retryCustomers } = await query.graph({
        entity: "customer",
        fields: ["id"],
        filters: { email: [checkoutEmail] },
      })

      if (retryCustomers.length) {
        return retryCustomers[0].id
      }

      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Unable to complete account setup for this subscription right now."
      )
    }

    const createdCustomer = customerResult.result?.[0]
    if (!createdCustomer?.id) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Unable to create customer account after checkout."
      )
    }

    return createdCustomer.id
  }

  const customerId = await resolveCustomerId()

  const ensureCustomerSubscriptionLink = async (subscriptionId: string) => {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "subscriptions.id"],
      filters: {
        id: [customerId],
      },
    })

    const isAlreadyLinked = (customer?.subscriptions || []).some((subscription) => subscription?.id === subscriptionId)
    if (isAlreadyLinked) {
      return
    }

    await link.create({
      [SUBSCRIPTION_MODULE]: { subscription_id: subscriptionId },
      [Modules.CUSTOMER]: { customer_id: customerId },
    })
  }

  const { data: existingSubscriptions } = await query.graph({
    entity: "subscription",
    fields: ["id", "stripe_subscription_id", "status", "metadata"],
    filters: {
      stripe_subscription_id: [stripeSubscriptionId],
    },
  })

  const existingByStripeSubscription = existingSubscriptions[0]
  if (existingByStripeSubscription) {
    await ensureCustomerSubscriptionLink(existingByStripeSubscription.id)

    res.json({
      subscription: {
        ...existingByStripeSubscription,
        status: mapStripeStatusToDisplayStatus(stripeSubscription.status),
      },
    })
    return
  }

  const firstSubscriptionItem = stripeSubscription.items.data[0]
  const recurring = firstSubscriptionItem?.price?.recurring

  if (!recurring || !recurring.interval_count) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Stripe subscription does not include recurring plan data."
    )
  }

  const interval =
    recurring.interval === "year"
      ? SubscriptionInterval.YEARLY
      : SubscriptionInterval.MONTHLY

  const period = recurring.interval_count

  const subscriptionModuleService: SubscriptionModuleService =
    req.scope.resolve(SUBSCRIPTION_MODULE)

  const createdSubscription = await subscriptionModuleService.createSubscriptions({
    interval,
    period,
    status: mapStripeStatusToInternalStatus(stripeSubscription.status),
    subscription_date: new Date(stripeSubscription.start_date * 1000),
    metadata: {
      checkout_session_id: checkoutSession.id,
      subscription_plan_id: checkoutSession.metadata?.subscription_plan_id,
      customer_id: customerId,
      customer_email: checkoutEmail,
    },
    stripe_customer_id:
      typeof stripeSubscription.customer === "string"
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id,
    stripe_subscription_id: stripeSubscription.id,
    stripe_price_id: firstSubscriptionItem?.price?.id,
    stripe_product_id:
      typeof firstSubscriptionItem?.price?.product === "string"
        ? firstSubscriptionItem.price.product
        : firstSubscriptionItem?.price?.product?.id,
  })

  await ensureCustomerSubscriptionLink(createdSubscription[0].id)

  res.json({
    subscription: {
      ...createdSubscription[0],
      status: mapStripeStatusToDisplayStatus(stripeSubscription.status),
    },
  })
}
