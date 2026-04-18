import { model } from "@medusajs/framework/utils"

const JourneyAttributionTouch = model.define("journey_attribution_touch", {
  id: model.id().primaryKey(),
  customer_id: model.text().index("IDX_JOURNEY_TOUCH_CUSTOMER"),
  visitor_id: model.text().index("IDX_JOURNEY_TOUCH_VISITOR").nullable(),
  session_id: model.text().index("IDX_JOURNEY_TOUCH_SESSION").nullable(),
  touched_at: model.dateTime(),
  touch_type: model.text().index("IDX_JOURNEY_TOUCH_TYPE"),
  source: model.text().nullable(),
  medium: model.text().nullable(),
  campaign: model.text().nullable(),
  landing_page: model.text().nullable(),
  referrer: model.text().nullable(),
  dedupe_key: model.text().unique(),
  metadata: model.json().nullable(),
})

export default JourneyAttributionTouch
