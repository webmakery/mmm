import { model } from "@medusajs/framework/utils"
import EmailTemplate from "./template"
import EmailCampaignLog from "./campaign-log"

export const CampaignStatuses = ["draft", "scheduled", "automated", "processing", "sent", "failed"] as const

const EmailCampaign = model.define("email_campaign", {
  id: model.id().primaryKey(),
  name: model.text(),
  subject: model.text(),
  sender_name: model.text(),
  sender_email: model.text(),
  scheduled_at: model.dateTime().nullable(),
  sent_at: model.dateTime().nullable(),
  status: model.enum(CampaignStatuses).default("draft"),
  audience_filter: model.json().nullable(),
  template: model.belongsTo(() => EmailTemplate, {
    mappedBy: "campaigns",
  }),
  logs: model.hasMany(() => EmailCampaignLog, {
    mappedBy: "campaign",
  }),
  metadata: model.json().nullable(),
})

export default EmailCampaign
