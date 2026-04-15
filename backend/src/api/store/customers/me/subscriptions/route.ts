import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import Stripe from "stripe"

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

  res.json({
    subscriptions: Array.from(subscriptionsById.values()),
  })
}
