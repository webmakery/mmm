import { model } from "@medusajs/framework/utils"
import LeadStage from "./lead-stage"
import LeadActivity from "./lead-activity"

export const LeadStatuses = ["new", "contacted", "qualified", "won", "lost"] as const

const Lead = model.define("lead", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text().nullable(),
  email: model.text().index("IDX_LEAD_EMAIL").nullable(),
  phone: model.text().nullable(),
  company: model.text().index("IDX_LEAD_COMPANY").nullable(),
  source: model.text().index("IDX_LEAD_SOURCE").nullable(),
  status: model.enum(LeadStatuses).default("new").index("IDX_LEAD_STATUS"),
  owner_user_id: model.text().index("IDX_LEAD_OWNER").nullable(),
  value_estimate: model.bigNumber().nullable(),
  notes_summary: model.text().nullable(),
  next_follow_up_at: model.dateTime().index("IDX_LEAD_NEXT_FOLLOW_UP").nullable(),
  customer_id: model.text().index("IDX_LEAD_CUSTOMER_ID").nullable(),
  metadata: model.json().nullable(),
  stage: model.belongsTo(() => LeadStage, {
    mappedBy: "leads",
  }),
  activities: model.hasMany(() => LeadActivity, {
    mappedBy: "lead",
  }),
})

export default Lead
