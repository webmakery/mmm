import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import Stripe from "stripe"

type ConfigModule = {
  admin?: {
    storefrontUrl?: string
  }
}

const appendQueryParam = (url: string, key: string, value: string) => {
  try {
    const parsedUrl = new URL(url)
    parsedUrl.searchParams.set(key, value)
    return parsedUrl.toString()
  } catch {
    const separator = url.includes("?") ? "&" : "?"
    return `${url}${separator}${key}=${encodeURIComponent(value)}`
  }
}

const getCountryCodeFromReferer = (referer?: string) => {
  if (!referer) {
    return undefined
  }

  try {
    const pathname = new URL(referer).pathname

    return pathname
      .split("/")
      .filter(Boolean)
      .at(0)
  } catch {
    return undefined
  }
}

const getStorefrontBaseUrl = (
  req: AuthenticatedMedusaRequest,
  configModule?: ConfigModule
) => {
  if (process.env.STRIPE_SUBSCRIPTION_STOREFRONT_URL) {
    return process.env.STRIPE_SUBSCRIPTION_STOREFRONT_URL
  }

  if (configModule?.admin?.storefrontUrl) {
    return configModule.admin.storefrontUrl
  }

  if (process.env.STOREFRONT_URL) {
    return process.env.STOREFRONT_URL
  }

  const referer = req.headers.referer

  if (!referer) {
    return undefined
  }

  try {
    return new URL(referer).origin
  } catch {
    return undefined
  }
}

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
  const configModule = req.scope.resolve<ConfigModule>("configModule")

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

  const countryCode = getCountryCodeFromReferer(req.headers.referer)
  const storefrontBaseUrl = getStorefrontBaseUrl(req, configModule)

  const localizedSubscriptionsPath = countryCode
    ? `/${countryCode}/account/subscriptions`
    : "/account/subscriptions"

  const defaultSuccessUrl = storefrontBaseUrl
    ? appendQueryParam(
        `${storefrontBaseUrl}${localizedSubscriptionsPath}`,
        "checkout",
        "success"
      )
    : undefined

  const defaultCancelUrl = storefrontBaseUrl
    ? appendQueryParam(
        `${storefrontBaseUrl}${localizedSubscriptionsPath}`,
        "checkout",
        "cancel"
      )
    : undefined

  const successUrl = process.env.STRIPE_SUBSCRIPTION_SUCCESS_URL || defaultSuccessUrl
  const cancelUrl = process.env.STRIPE_SUBSCRIPTION_CANCEL_URL || defaultCancelUrl

  if (!successUrl || !cancelUrl) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Missing Stripe checkout return URL configuration."
    )
  }

  const stripe = new Stripe(stripeApiKey)

  const successUrlWithSessionId = appendQueryParam(
    successUrl,
    "session_id",
    "{CHECKOUT_SESSION_ID}"
  )

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
