import { model } from "@medusajs/framework/utils"
import LeadStage from "./lead-stage"
import LeadActivity from "./lead-activity"

export const LeadStatuses = ["new", "contacted", "qualified", "won", "lost"] as const
export const LeadFollowUpStatuses = [
  "not_scheduled",
  "scheduled",
  "pending_approval",
  "approved",
  "sent",
  "failed",
] as const

const Lead = model.define("lead", {
  id: model.id().primaryKey(),
  first_name: model.text(),
  last_name: model.text().nullable(),
  email: model.text().index("IDX_LEAD_EMAIL").nullable(),
  phone: model.text().nullable(),
  website: model.text().nullable(),
  google_maps_uri: model.text().nullable(),
  company: model.text().index("IDX_LEAD_COMPANY").nullable(),
  source: model.text().index("IDX_LEAD_SOURCE").nullable(),
  source_detail: model.text().nullable(),
  category: model.text().nullable(),
  status: model.enum([...LeadStatuses]).default("new").index("IDX_LEAD_STATUS"),
  lead_score: model.number().index("IDX_LEAD_SCORE").nullable(),
  lead_score_notes: model.text().nullable(),
  pain_points: model.json().nullable(),
  owner_user_id: model.text().index("IDX_LEAD_OWNER").nullable(),
  value_estimate: model.bigNumber().nullable(),
  notes_summary: model.text().nullable(),
  next_follow_up_at: model.dateTime().index("IDX_LEAD_NEXT_FOLLOW_UP").nullable(),
  follow_up_status: model
    .enum([...LeadFollowUpStatuses])
    .default("not_scheduled")
    .index("IDX_LEAD_FOLLOW_UP_STATUS"),
  follow_up_event_id: model.text().nullable(),
  outreach_message_draft: model.text().nullable(),
  outreach_approved_at: model.dateTime().nullable(),
  outreach_sent_at: model.dateTime().nullable(),
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
