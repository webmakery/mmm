import { model } from "@medusajs/framework/utils"

const JourneyCustomerRollup = model.define("journey_customer_rollup", {
  id: model.id().primaryKey(),
  customer_id: model.text().unique(),
  first_seen_at: model.dateTime().nullable(),
  first_signup_at: model.dateTime().nullable(),
  first_order_at: model.dateTime().nullable(),
  first_payment_captured_at: model.dateTime().nullable(),
  total_sessions: model.number().default(0),
  total_events: model.number().default(0),
  signup_started_at: model.dateTime().nullable(),
  signup_completed_at: model.dateTime().nullable(),
  last_event_at: model.dateTime().nullable(),
  last_event_name: model.text().nullable(),
  latest_source: model.text().nullable(),
  latest_medium: model.text().nullable(),
  latest_campaign: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default JourneyCustomerRollup
