import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import Stripe from "stripe"
import {
  mapStripeStatusToDisplayStatus,
  normalizeSubscriptionDisplayStatus,
} from "../../../../../modules/subscription/utils/stripe-status"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id

  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must be authenticated to view subscriptions."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "email",
      "subscriptions.*",
      "subscriptions.stripe_customer_id",
      "subscriptions.stripe_subscription_id",
      "subscriptions.stripe_price_id",
      "subscriptions.stripe_product_id",
    ],
    filters: {
      id: [actorId],
    },
  })

  if (!customer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found.")
  }

  const subscriptionsById = new Map<string, Record<string, unknown>>()

  for (const subscription of customer.subscriptions || []) {
    if (subscription?.id) {
      subscriptionsById.set(subscription.id, subscription as Record<string, unknown>)
    }
  }

  const stripeSubscriptionsByStripeId = new Map<string, Stripe.Subscription>()

  const stripeApiKey = process.env.STRIPE_API_KEY

  if (stripeApiKey && customer.email) {
    const stripe = new Stripe(stripeApiKey)

    const stripeCustomers = await stripe.customers.list({
      email: customer.email,
      limit: 100,
    })

    const stripeCustomerIds = stripeCustomers.data.map((item) => item.id)

    if (stripeCustomerIds.length) {
      const { data: stripeSubscriptions } = await query.graph({
        entity: "subscription",
        fields: [
          "*",
          "stripe_customer_id",
          "stripe_subscription_id",
          "stripe_price_id",
          "stripe_product_id",
        ],
        filters: {
          stripe_customer_id: stripeCustomerIds,
        },
      })

      for (const subscription of stripeSubscriptions) {
        if (subscription?.id) {
          subscriptionsById.set(subscription.id, subscription as Record<string, unknown>)
        }
      }
    }
  }

  const stripeSubscriptionIds = Array.from(subscriptionsById.values())
    .map((subscription) => subscription.stripe_subscription_id)
    .filter((value): value is string => typeof value === "string" && !!value)

  if (stripeApiKey && stripeSubscriptionIds.length) {
    const stripe = new Stripe(stripeApiKey)

    await Promise.all(
      [...new Set(stripeSubscriptionIds)].map(async (stripeSubscriptionId) => {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(
            stripeSubscriptionId
          )
          stripeSubscriptionsByStripeId.set(stripeSubscription.id, stripeSubscription)
        } catch (error) {
          req.scope.resolve(ContainerRegistrationKeys.LOGGER).warn(
            `Unable to retrieve Stripe subscription ${stripeSubscriptionId}`
          )
        }
      })
    )
  }

  const subscriptions = Array.from(subscriptionsById.values()).map(
    (subscription) => {
      const stripeSubscriptionId = subscription.stripe_subscription_id
      const stripeSubscription =
        typeof stripeSubscriptionId === "string"
          ? stripeSubscriptionsByStripeId.get(stripeSubscriptionId)
          : undefined

      const status = stripeSubscription
        ? mapStripeStatusToDisplayStatus(stripeSubscription.status)
        : normalizeSubscriptionDisplayStatus(
            typeof subscription.status === "string" ? subscription.status : null
          )

      return {
        ...subscription,
        status,
      }
    }
  )

  res.json({
    subscriptions,
  })
}
