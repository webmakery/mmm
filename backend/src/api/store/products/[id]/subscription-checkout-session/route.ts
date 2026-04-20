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

type ProductSubscriptionMetadata = {
  is_subscription_product?: boolean
  interval?: "monthly" | "yearly" | string
  stripe_product_id?: string
  stripe_price_id?: string
  extra_metadata_json?: string
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

const appendRawQueryParam = (url: string, key: string, value: string) => {
  const hashIndex = url.indexOf("#")
  const urlWithoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const hash = hashIndex === -1 ? "" : url.slice(hashIndex)
  const separator = urlWithoutHash.includes("?") ? "&" : "?"

  return `${urlWithoutHash}${separator}${key}=${value}${hash}`
}

const getCountryCodeFromReferer = (referer?: string) => {
  if (!referer) {
    return undefined
  }

  try {
    const pathname = new URL(referer).pathname

    return pathname.split("/").filter(Boolean).at(0)
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

const asSubscriptionMetadata = (
  metadata: Record<string, unknown> | null | undefined
): ProductSubscriptionMetadata | null => {
  if (!metadata || typeof metadata !== "object") {
    return null
  }

  const subscription = metadata.subscription

  if (!subscription || typeof subscription !== "object") {
    return null
  }

  return subscription as ProductSubscriptionMetadata
}

const parseExtraMetadata = (raw?: string) => {
  if (!raw || !raw.trim()) {
    return {}
  }

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("invalid_shape")
    }

    return Object.entries(parsed).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value == null) {
        return acc
      }

      acc[key] = typeof value === "string" ? value : JSON.stringify(value)
      return acc
    }, {})
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Product subscription metadata JSON must be a valid JSON object."
    )
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
      "You must be authenticated to subscribe to a product."
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
    data: [product],
  } = await query.graph({
    entity: "product",
    fields: ["id", "title", "metadata"],
    filters: {
      id: [req.params.id],
      status: "published",
    },
  })

  if (!product) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Product was not found.")
  }

  const subscription = asSubscriptionMetadata(product.metadata as Record<string, unknown> | null)

  if (!subscription?.is_subscription_product) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Product is not configured as a subscription product."
    )
  }

  if (!subscription.stripe_price_id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Subscription product is missing a Stripe price ID."
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
    (record) =>
      typeof (record as Record<string, unknown> | null)?.stripe_customer_id === "string" &&
      !!(record as Record<string, unknown> | null)?.stripe_customer_id
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
  const successUrlWithSessionId = appendRawQueryParam(
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
        price: subscription.stripe_price_id,
        quantity: 1,
      },
    ],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : customer.email,
    metadata: {
      customer_id: customer.id,
      customer_email: customer.email,
      subscription_interval: subscription.interval || "monthly",
      product_id: product.id,
      product_title: product.title,
      stripe_price_id: subscription.stripe_price_id,
      stripe_product_id: subscription.stripe_product_id || "",
      ...parseExtraMetadata(subscription.extra_metadata_json),
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
