import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import Stripe from "stripe"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id

  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must be authenticated to manage subscriptions."
    )
  }

  const stripeApiKey = process.env.STRIPE_API_KEY
  const returnUrl = process.env.STRIPE_CUSTOMER_PORTAL_RETURN_URL

  if (!stripeApiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing STRIPE_API_KEY configuration."
    )
  }

  if (!returnUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing STRIPE_CUSTOMER_PORTAL_RETURN_URL configuration."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: ["subscriptions.stripe_customer_id"],
    filters: {
      id: [actorId],
    },
  })

  const stripeCustomerId = customer?.subscriptions?.find(
    (subscription) =>
      typeof (subscription as Record<string, unknown> | null)?.stripe_customer_id ===
        "string" &&
      !!(subscription as Record<string, unknown> | null)?.stripe_customer_id
  )?.stripe_customer_id as string | undefined

  if (!stripeCustomerId) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No Stripe customer is linked to this account."
    )
  }

  const stripe = new Stripe(stripeApiKey)

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: returnUrl,
  })

  res.json({
    url: portalSession.url,
  })
}
