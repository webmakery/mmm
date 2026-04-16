import { model } from "@medusajs/framework/utils"
import Conversation from "./conversation"
import Message from "./message"

import { InboxProvider } from "./inbox-provider"

const ChannelAccount = model.define("channel_account", {
  id: model.id().primaryKey(),
  provider: model.enum(InboxProvider).default("whatsapp"),
  external_account_id: model.text().unique(),
  display_name: model.text().nullable(),
  metadata: model.json().nullable(),
  raw_payload: model.json().nullable(),
  conversations: model.hasMany(() => Conversation, {
    mappedBy: "channel_account",
  }),
  messages: model.hasMany(() => Message, {
    mappedBy: "channel_account",
  }),
})

export default ChannelAccount
