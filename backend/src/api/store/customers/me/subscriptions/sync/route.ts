import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { z } from "zod"
import Stripe from "stripe"
import SubscriptionModuleService from "../../../../../../modules/subscription/service"
import { SUBSCRIPTION_MODULE } from "../../../../../../modules/subscription"
import {
  SubscriptionInterval,
  SubscriptionStatus,
} from "../../../../../../modules/subscription/types"

export const PostStoreSyncSubscriptionSchema = z.object({
  session_id: z.string().min(1),
})

type StripeSubscriptionStatus = Stripe.Subscription.Status

const mapStripeStatusToSubscriptionStatus = (
  status: StripeSubscriptionStatus
): SubscriptionStatus => {
  if (status === "canceled" || status === "incomplete_expired") {
    return SubscriptionStatus.CANCELED
  }

  if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "paused"
  ) {
    return SubscriptionStatus.FAILED
  }

  return SubscriptionStatus.ACTIVE
}

export const POST = async (
  req: AuthenticatedMedusaRequest<z.infer<typeof PostStoreSyncSubscriptionSchema>>,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id

  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must be authenticated to sync subscriptions."
    )
  }

  const stripeApiKey = process.env.STRIPE_API_KEY

  if (!stripeApiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing STRIPE_API_KEY configuration."
    )
  }

  const stripe = new Stripe(stripeApiKey)

  const checkoutSession = await stripe.checkout.sessions.retrieve(
    req.validatedBody.session_id,
    {
      expand: ["subscription"],
    }
  )

  if (checkoutSession.mode !== "subscription") {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Checkout session is not a subscription session."
    )
  }

  const metadataCustomerId = checkoutSession.metadata?.customer_id

  if (metadataCustomerId && metadataCustomerId !== actorId) {
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

  const ensureCustomerSubscriptionLink = async (subscriptionId: string) => {
    const {
      data: [customer],
    } = await query.graph({
      entity: "customer",
      fields: ["id", "subscriptions.id"],
      filters: {
        id: [actorId],
      },
    })

    const isAlreadyLinked = (customer?.subscriptions || []).some(
      (subscription) => subscription?.id === subscriptionId
    )

    if (isAlreadyLinked) {
      return
    }

    await link.create({
      [SUBSCRIPTION_MODULE]: {
        subscription_id: subscriptionId,
      },
      [Modules.CUSTOMER]: {
        customer_id: actorId,
      },
    })
  }

  const { data: existingSubscriptions } = await query.graph({
    entity: "subscription",
    fields: ["id", "stripe_subscription_id"],
    filters: {
      stripe_subscription_id: [stripeSubscriptionId],
    },
  })

  if (existingSubscriptions.length) {
    await ensureCustomerSubscriptionLink(existingSubscriptions[0].id)

    res.json({
      subscription: existingSubscriptions[0],
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
    status: mapStripeStatusToSubscriptionStatus(stripeSubscription.status),
    subscription_date: new Date(stripeSubscription.start_date * 1000),
    metadata: {
      checkout_session_id: checkoutSession.id,
      subscription_plan_id: checkoutSession.metadata?.subscription_plan_id,
      customer_id: actorId,
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
    subscription: createdSubscription[0],
  })
}
