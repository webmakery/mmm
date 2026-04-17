import { model } from "@medusajs/framework/utils"
import LeadStage from "./lead-stage"
import LeadActivity from "./lead-activity"

export const LeadStatuses = ["new", "contacted", "qualified", "won", "lost"] as const

const Lead = model.define("lead", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text().nullable(),
  email: model.text().nullable().index("IDX_LEAD_EMAIL"),
  phone: model.text().nullable(),
  company: model.text().nullable().index("IDX_LEAD_COMPANY"),
  source: model.text().nullable().index("IDX_LEAD_SOURCE"),
  status: model.enum(LeadStatuses).default("new").index("IDX_LEAD_STATUS"),
  owner_user_id: model.text().nullable().index("IDX_LEAD_OWNER"),
  value_estimate: model.bigNumber().nullable(),
  notes_summary: model.text().nullable(),
  next_follow_up_at: model.dateTime().nullable().index("IDX_LEAD_NEXT_FOLLOW_UP"),
  customer_id: model.text().nullable().index("IDX_LEAD_CUSTOMER_ID"),
  metadata: model.json().nullable(),
  stage: model.belongsTo(() => LeadStage, {
    mappedBy: "leads",
  }),
  activities: model.hasMany(() => LeadActivity, {
    mappedBy: "lead",
  }),
})

export default Lead
