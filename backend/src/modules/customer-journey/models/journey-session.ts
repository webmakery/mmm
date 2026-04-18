import { model } from "@medusajs/framework/utils"
const JourneySession = model.define("journey_session", {
  id: model.id().primaryKey(),
  session_id: model.text().unique(),
  visitor_id: model.text().index("IDX_JOURNEY_SESSION_VISITOR"),
  started_at: model.dateTime(),
  last_seen_at: model.dateTime(),
  landing_page: model.text().nullable(),
  referrer: model.text().nullable(),
  utm_source: model.text().nullable(),
  utm_medium: model.text().nullable(),
  utm_campaign: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default JourneySession
