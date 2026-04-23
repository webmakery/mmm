import { model } from "@medusajs/framework/utils"
import EmailCampaign from "./campaign"
import Subscriber from "./subscriber"

export const CampaignLogStatuses = ["queued", "sent", "delivered", "opened", "clicked", "failed"] as const

const EmailCampaignLog = model.define("email_campaign_log", {
  id: model.id().primaryKey(),
  provider_message_id: model.text().nullable(),
  status: model.enum([...CampaignLogStatuses]).default("queued"),
  error_message: model.text().nullable(),
  delivered_at: model.dateTime().nullable(),
  opened_at: model.dateTime().nullable(),
  clicked_at: model.dateTime().nullable(),
  campaign: model.belongsTo(() => EmailCampaign, {
    mappedBy: "logs",
  }),
  subscriber: model.belongsTo(() => Subscriber, {
    mappedBy: "campaign_logs",
  }),
  metadata: model.json().nullable(),
})

export default EmailCampaignLog
