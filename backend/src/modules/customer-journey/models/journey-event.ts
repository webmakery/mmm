import { model } from "@medusajs/framework/utils"
const JourneyEvent = model.define("journey_event", {
  id: model.id().primaryKey(),
  event_id: model.text().unique(),
  idempotency_key: model.text().unique(),
  event_name: model.text().index("IDX_JOURNEY_EVENT_NAME"),
  occurred_at: model.dateTime(),
  visitor_id: model.text().index("IDX_JOURNEY_EVENT_VISITOR"),
  session_id: model.text().index("IDX_JOURNEY_EVENT_SESSION").nullable(),
  customer_id: model.text().index("IDX_JOURNEY_EVENT_CUSTOMER_ID").nullable(),
  event_source: model.text().nullable(),
  page_url: model.text().nullable(),
  referrer: model.text().nullable(),
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  payload: model.json().nullable(),
})

export default JourneyEvent
