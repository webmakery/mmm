import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { Logger } from "@medusajs/framework/types"
import Stripe from "stripe"
import { processStripeWebhookEvent } from "../../../services/stripe-webhook-handler"

export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const logger = req.scope.resolve("logger") as Logger
  const stripeApiKey = process.env.STRIPE_API_KEY
  const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  logger.info("[stripe-webhook] custom webhook route hit path=/hooks/stripe")

  if (!stripeApiKey || !stripeWebhookSecret) {
    res.status(500).json({
      message: "Missing STRIPE_API_KEY or STRIPE_WEBHOOK_SECRET configuration.",
    })
    return
  }

  const stripe = new Stripe(stripeApiKey)

  const signature = req.headers["stripe-signature"]

  if (!signature || Array.isArray(signature)) {
    res.status(400).json({ message: "Missing stripe-signature header." })
    return
  }

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(JSON.stringify(req.body || {}))

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown signature verification error"
    logger.error(`[stripe-webhook] Signature verification failed: ${message}`)
    res.status(400).json({ message: "Invalid Stripe webhook signature." })
    return
  }

  try {
    const result = await processStripeWebhookEvent({
      container: req.scope as any,
      event,
      logger,
    })

    res.status(200).json({ received: true, duplicate: result.duplicate })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown webhook processing error"
    logger.error(`[stripe-webhook] Failed to process event ${event.id}: ${message}`)
    res.status(500).json({ message })
  }
}
