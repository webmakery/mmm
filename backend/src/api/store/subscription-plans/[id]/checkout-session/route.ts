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
      "You must be authenticated to subscribe to a plan."
    )
  }

  const stripeApiKey = process.env.STRIPE_API_KEY

  if (!stripeApiKey) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing STRIPE_API_KEY configuration."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [subscriptionPlan],
  } = await query.graph({
    entity: "subscription_plan",
    fields: [
      "id",
      "name",
      "stripe_product_id",
      "stripe_price_id",
      "interval",
      "active",
    ],
    filters: {
      id: [req.params.id],
      active: true,
    },
  })

  if (!subscriptionPlan) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Subscription plan was not found."
    )
  }

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "email",
      "first_name",
      "last_name",
      "subscriptions.stripe_customer_id",
    ],
    filters: {
      id: [actorId],
    },
  })

  if (!customer?.email) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Customer email is required to start Stripe checkout."
    )
  }

  const stripeCustomerId = customer.subscriptions?.find(
    (subscription) =>
      typeof (subscription as Record<string, unknown> | null)?.stripe_customer_id ===
        "string" &&
      !!(subscription as Record<string, unknown> | null)?.stripe_customer_id
  )?.stripe_customer_id as string | undefined

  const forwardedProto = req.headers["x-forwarded-proto"]
  const forwardedHost = req.headers["x-forwarded-host"]
  const host = req.headers.host
  const protocol = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto || "http"
  const hostname = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost || host
  const baseUrl = hostname ? `${protocol}://${hostname}` : undefined

  const successUrl =
    process.env.STRIPE_SUBSCRIPTION_SUCCESS_URL ||
    (baseUrl ? `${baseUrl}/account/subscriptions` : undefined)
  const cancelUrl =
    process.env.STRIPE_SUBSCRIPTION_CANCEL_URL ||
    (baseUrl ? `${baseUrl}/plans` : undefined)

  if (!successUrl || !cancelUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing Stripe checkout return URL configuration."
    )
  }

  const stripe = new Stripe(stripeApiKey)

  const successUrlWithSessionId = successUrl.includes("?")
    ? `${successUrl}&session_id={CHECKOUT_SESSION_ID}`
    : `${successUrl}?session_id={CHECKOUT_SESSION_ID}`

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    success_url: successUrlWithSessionId,
    cancel_url: cancelUrl,
    line_items: [
      {
        price: subscriptionPlan.stripe_price_id,
        quantity: 1,
      },
    ],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : customer.email,
    metadata: {
      customer_id: customer.id,
      customer_email: customer.email,
      subscription_plan_id: subscriptionPlan.id,
      stripe_price_id: subscriptionPlan.stripe_price_id,
      stripe_product_id: subscriptionPlan.stripe_product_id,
    },
  })

  if (!checkoutSession.url) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      "Stripe checkout session did not return a redirect URL."
    )
  }

  res.json({
    url: checkoutSession.url,
    id: checkoutSession.id,
  })
}
