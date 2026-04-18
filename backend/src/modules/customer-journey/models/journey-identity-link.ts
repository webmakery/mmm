import { model } from "@medusajs/framework/utils"
const JourneyIdentityLink = model.define("journey_identity_link", {
  id: model.id().primaryKey(),
  visitor_id: model.text().index("IDX_JOURNEY_IDENTITY_VISITOR"),
  customer_id: model.text().index("IDX_JOURNEY_IDENTITY_CUSTOMER"),
  linked_at: model.dateTime(),
  source: model.text().nullable(),
  dedupe_key: model.text().unique(),
  metadata: model.json().nullable(),
})

export default JourneyIdentityLink
