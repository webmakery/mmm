import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import Stripe from "stripe"
import { processStripeWebhookEvent } from "../services/stripe-webhook-handler"

type PaymentWebhookPayload = {
  provider?: string
  payload?: {
    rawData?: Buffer | { type: "Buffer"; data: number[] }
    headers?: Record<string, string | string[] | undefined>
  }
}

type RawWebhookData = Buffer | { type: "Buffer"; data: number[] } | undefined

const getHeader = (
  headers: Record<string, string | string[] | undefined>,
  key: string
): string | undefined => {
  const direct = headers[key] ?? headers[key.toLowerCase()] ?? headers[key.toUpperCase()]
  if (typeof direct === "string") {
    return direct
  }

  if (Array.isArray(direct) && direct[0]) {
    return direct[0]
  }

  const matchedKey = Object.keys(headers).find((header) => header.toLowerCase() === key.toLowerCase())
  const matchedValue = matchedKey ? headers[matchedKey] : undefined

  if (typeof matchedValue === "string") {
    return matchedValue
  }

  if (Array.isArray(matchedValue) && matchedValue[0]) {
    return matchedValue[0]
  }

  return undefined
}

const getRawBody = (rawData: RawWebhookData) => {
  if (Buffer.isBuffer(rawData)) {
    return rawData
  }

  if (
    rawData &&
    typeof rawData === "object" &&
    rawData.type === "Buffer" &&
    Array.isArray(rawData.data)
  ) {
    return Buffer.from(rawData.data)
  }

  return null
}

export default async function stripePaymentWebhookHandler({
  event,
  container,
}: SubscriberArgs<PaymentWebhookPayload>) {
  const payload = event.data || {}
  const provider = payload.provider || ""

  if (provider !== "stripe_stripe" && provider !== "stripe") {
    return
  }

  const logger = container.resolve("logger") as Logger
  const stripeApiKey = process.env.STRIPE_API_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  logger.info(`[stripe-webhook] active payment webhook route hit provider=${provider}`)

  if (!stripeApiKey || !stripeWebhookSecret) {
    logger.error("[stripe-webhook] Missing STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET configuration")
    return
  }

  const rawBody = getRawBody(payload.payload?.rawData)

  if (!rawBody) {
    logger.error("[stripe-webhook] payment.webhook_received did not include rawData")
    return
  }

  const headers = payload.payload?.headers || {}
  const signature = getHeader(headers, "stripe-signature")

  if (!signature) {
    logger.error("[stripe-webhook] Missing stripe-signature header on payment.webhook_received")
    return
  }

  const stripe = new Stripe(stripeApiKey)

  try {
    const stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)

    await processStripeWebhookEvent({
      container: container as any,
      event: stripeEvent,
      logger,
    })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown payment webhook processing error"
    logger.error(`[stripe-webhook] Failed to process active payment webhook: ${message}`)
  }
}

export const config: SubscriberConfig = {
  event: "payment.webhook_received",
  context: {
    subscriberId: "subscription-infrastructure-stripe-webhook",
  },
}
