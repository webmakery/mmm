import { model } from "@medusajs/framework/utils"
import ChannelAccount from "./channel-account"
import { InboxProvider } from "./inbox-provider"
import Participant from "./participant"
import Message from "./message"

export const ConversationStatus = ["open", "closed", "archived"] as const
export const ConversationChannel = ["whatsapp", "messenger", "instagram"] as const

const Conversation = model.define("conversation", {
  id: model.id().primaryKey(),
  tenant_id: model.text().index().nullable(),
  provider: model.enum(InboxProvider).default("whatsapp"),
  channel: model.enum(ConversationChannel).default("whatsapp"),
  external_thread_id: model.text().nullable(),
  external_user_id: model.text().nullable(),
  customer_identifier: model.text().index(),
  customer_phone: model.text().index(),
  customer_name: model.text().nullable(),
  customer_handle: model.text().nullable(),
  page_id: model.text().nullable(),
  instagram_account_id: model.text().nullable(),
  subject: model.text().nullable(),
  last_message_preview: model.text().nullable(),
  status: model.enum(ConversationStatus).default("open"),
  unread_count: model.number().default(0),
  last_message_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
  channel_account: model.belongsTo(() => ChannelAccount, {
    mappedBy: "conversations",
  }),
  participants: model.hasMany(() => Participant, {
    mappedBy: "conversation",
  }),
  messages: model.hasMany(() => Message, {
    mappedBy: "conversation",
  }),
})

export default Conversation
