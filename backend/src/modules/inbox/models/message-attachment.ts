import { model } from "@medusajs/framework/utils"
import Message from "./message"

const MessageAttachment = model.define("message_attachment", {
  id: model.id().primaryKey(),
  provider_attachment_id: model.text().nullable(),
  mime_type: model.text().nullable(),
  filename: model.text().nullable(),
  url: model.text().nullable(),
  metadata: model.json().nullable(),
  raw_payload: model.json().nullable(),
  message: model.belongsTo(() => Message, {
    mappedBy: "attachments",
  }),
})

export default MessageAttachment
