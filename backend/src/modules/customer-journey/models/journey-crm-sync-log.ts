import { model } from "@medusajs/framework/utils"

const JourneyCrmSyncLog = model.define("journey_crm_sync_log", {
  id: model.id().primaryKey(),
  customer_id: model.text().index("IDX_JOURNEY_CRM_CUSTOMER"),
  sync_key: model.text().unique(),
  status: model.text().index("IDX_JOURNEY_CRM_STATUS"),
  attempted_at: model.dateTime(),
  payload_summary: model.json().nullable(),
  response_summary: model.json().nullable(),
  error_message: model.text().nullable(),
})

export default JourneyCrmSyncLog
