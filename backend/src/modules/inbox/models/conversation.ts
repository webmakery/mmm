import { model } from "@medusajs/framework/utils"
import ChannelAccount from "./channel-account"
import { InboxProvider } from "./inbox-provider"
import Participant from "./participant"
import Message from "./message"

export const ConversationStatus = ["open", "archived"] as const

const Conversation = model.define("conversation", {
  id: model.id().primaryKey(),
  provider: model.enum(InboxProvider).default("whatsapp"),
  external_thread_id: model.text().nullable(),
  customer_identifier: model.text().index(),
  subject: model.text().nullable(),
  status: model.enum(ConversationStatus).default("open"),
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
