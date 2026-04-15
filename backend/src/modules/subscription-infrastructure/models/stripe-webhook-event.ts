import { model } from "@medusajs/framework/utils"

const StripeWebhookEvent = model.define("stripe_webhook_event", {
  id: model.id().primaryKey(),
  event_id: model.text(),
  event_type: model.text(),
  processed_at: model.dateTime(),
})

export default StripeWebhookEvent
