import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const PatchAdminInboxConversationSchema = z.object({
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
})

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data } = await query.graph({
    entity: "conversation",
    fields: [
      "id",
      "channel",
      "customer_phone",
      "customer_email",
      "customer_identifier",
      "customer_name",
      "customer_handle",
      "external_user_id",
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
      "messages.message_type",
      "messages.text",
      "messages.content",
      "messages.status",
      "messages.external_message_id",
      "messages.whatsapp_message_id",
      "messages.created_at",
      "messages.sent_at",
      "messages.received_at",
      "messages.participant.id",
      "messages.participant.role",
      "messages.participant.display_name",
      "messages.participant.external_id",
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

export async function PATCH(
  req: AuthenticatedMedusaRequest<z.infer<typeof PatchAdminInboxConversationSchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const [conversation] = await inboxService.listConversations({ id: req.params.id })

  if (!conversation) {
    return res.status(404).json({
      message: "Conversation not found",
    })
  }

  const customerName = typeof req.validatedBody.customer_name === "string" ? req.validatedBody.customer_name.trim() : undefined
  const customerEmail = typeof req.validatedBody.customer_email === "string" ? req.validatedBody.customer_email.trim() : undefined
  const customerPhone = typeof req.validatedBody.customer_phone === "string" ? req.validatedBody.customer_phone.trim() : undefined

  await inboxService.updateConversations({
    id: req.params.id,
    customer_name: customerName ?? conversation.customer_name ?? null,
    customer_email: customerEmail ?? conversation.customer_email ?? null,
    customer_phone: customerPhone ?? conversation.customer_phone ?? "",
  })

  const updated = await inboxService.retrieveConversation(req.params.id)

  res.json({
    conversation: updated,
  })
}
