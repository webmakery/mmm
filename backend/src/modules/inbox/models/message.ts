import { model } from "@medusajs/framework/utils"
import ChannelAccount from "./channel-account"
import { InboxProvider } from "./inbox-provider"
import Conversation from "./conversation"
import Participant from "./participant"
import MessageAttachment from "./message-attachment"

export const MessageDirection = ["inbound", "outbound", "system"] as const
export const MessageType = ["text", "status", "unsupported"] as const
export const MessageStatus = ["pending", "sent", "delivered", "read", "failed", "received"] as const

const Message = model.define("message", {
  id: model.id().primaryKey(),
  provider: model.enum(InboxProvider).default("whatsapp"),
  external_message_id: model.text().unique().nullable(),
  external_event_id: model.text().unique().nullable(),
  direction: model.enum(MessageDirection),
  message_type: model.enum(MessageType).default("text"),
  status: model.enum(MessageStatus).default("pending"),
  provider_status: model.text().nullable(),
  content: model.text().nullable(),
  error_message: model.text().nullable(),
  sent_at: model.dateTime().nullable(),
  received_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
  raw_payload: model.json().nullable(),
  conversation: model.belongsTo(() => Conversation, {
    mappedBy: "messages",
  }),
  participant: model.belongsTo(() => Participant, {
    mappedBy: "messages",
  }).nullable(),
  channel_account: model.belongsTo(() => ChannelAccount, {
    mappedBy: "messages",
  }),
  attachments: model.hasMany(() => MessageAttachment, {
    mappedBy: "message",
  }),
})

export default Message
