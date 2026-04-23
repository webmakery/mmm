import { model } from "@medusajs/framework/utils"
import Conversation from "./conversation"
import Message from "./message"

export const ParticipantRole = ["customer", "agent", "system"] as const

const Participant = model.define("participant", {
  id: model.id().primaryKey(),
  role: model.enum([...ParticipantRole]).default("customer"),
  display_name: model.text().nullable(),
  external_id: model.text(),
  metadata: model.json().nullable(),
  conversation: model.belongsTo(() => Conversation, {
    mappedBy: "participants",
  }),
  messages: model.hasMany(() => Message, {
    mappedBy: "participant",
  }),
})

export default Participant
