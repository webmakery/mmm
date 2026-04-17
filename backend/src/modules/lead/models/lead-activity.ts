import { model } from "@medusajs/framework/utils"
import Lead from "./lead"

export const LeadActivityTypes = [
  "note",
  "call",
  "email",
  "meeting",
  "task",
  "status_change",
] as const

const LeadActivity = model.define("lead_activity", {
  id: model.id().primaryKey(),
  type: model.enum(LeadActivityTypes).index("IDX_LEAD_ACTIVITY_TYPE"),
  content: model.text(),
  created_by: model.text().nullable(),
  due_at: model.dateTime().nullable().index("IDX_LEAD_ACTIVITY_DUE_AT"),
  completed_at: model.dateTime().nullable(),
  lead: model.belongsTo(() => Lead, {
    mappedBy: "activities",
  }),
})

export default LeadActivity
