import { model } from "@medusajs/framework/utils"
import EmailCampaignLog from "./campaign-log"

export const SubscriberStatuses = ["active", "unsubscribed", "bounced"] as const

const Subscriber = model.define("email_subscriber", {
  id: model.id().primaryKey(),
  email: model.text().unique(),
  first_name: model.text().nullable(),
  last_name: model.text().nullable(),
  status: model.enum(SubscriberStatuses).default("active"),
  tags: model.json().nullable(),
  source: model.text().nullable(),
  unsubscribe_token: model.text().index("IDX_EMAIL_SUBSCRIBER_UNSUB_TOKEN").nullable(),
  unsubscribed_at: model.dateTime().nullable(),
  bounced_at: model.dateTime().nullable(),
  campaign_logs: model.hasMany(() => EmailCampaignLog, {
    mappedBy: "subscriber",
  }),
  metadata: model.json().nullable(),
})

export default Subscriber
