import { model } from "@medusajs/framework/utils"

const JourneyVisitor = model.define("journey_visitor", {
  id: model.id().primaryKey(),
  anonymous_id: model.text().unique(),
  first_seen_at: model.dateTime(),
  last_seen_at: model.dateTime(),
  first_referrer: model.text().nullable(),
  first_landing_page: model.text().nullable(),
  first_utm_source: model.text().nullable(),
  first_utm_medium: model.text().nullable(),
  first_utm_campaign: model.text().nullable(),
  metadata: model.json().nullable(),
})

export default JourneyVisitor
