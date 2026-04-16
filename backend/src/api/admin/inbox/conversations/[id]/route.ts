import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "conversation",
    fields: [
      "id",
      "channel",
      "customer_phone",
      "customer_name",
      "customer_handle",
      "last_message_preview",
      "last_message_at",
      "unread_count",
      "status",
      "tenant_id",
      "created_at",
      "updated_at",
      "messages.id",
      "messages.channel",
      "messages.direction",
      "messages.text",
      "messages.content",
      "messages.status",
      "messages.external_message_id",
      "messages.whatsapp_message_id",
      "messages.created_at",
      "messages.sent_at",
      "messages.received_at",
    ],
    filters: {
      id: req.params.id,
    },
  })

  const conversation = data[0]

  if (!conversation) {
    return res.status(404).json({
      message: "Conversation not found",
    })
  }

  const messages = [...(conversation.messages || [])].sort((a, b) => {
    const aTime = new Date(a.received_at || a.sent_at || a.created_at).getTime()
    const bTime = new Date(b.received_at || b.sent_at || b.created_at).getTime()
    return aTime - bTime
  })

  res.json({
    conversation: {
      ...conversation,
      messages,
    },
  })
}
