import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../../modules/inbox"
import InboxModuleService from "../../../../../../modules/inbox/service"

export const GetAdminInboxConversationMessagesSchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
})

export const PostAdminInboxConversationMessageSchema = z.object({
  text: z.string().trim().min(1),
  type: z.enum(["message", "private_note"]).default("message"),
})

export async function GET(
  req: AuthenticatedMedusaRequest<z.infer<typeof GetAdminInboxConversationMessagesSchema>>,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")

  const { data: messages, metadata } = await query.graph({
    entity: "message",
    fields: [
      "id",
      "channel",
      "direction",
      "message_type",
      "text",
      "content",
      "status",
      "external_message_id",
      "whatsapp_message_id",
      "sent_at",
      "received_at",
      "participant.id",
      "participant.role",
      "participant.display_name",
      "participant.external_id",
      "metadata",
      "created_at",
      "updated_at",
    ],
    filters: {
      conversation_id: req.params.id,
    },
    pagination: {
      skip: req.validatedQuery.offset,
      take: req.validatedQuery.limit,
      order: {
        created_at: "ASC",
      },
    },
  })

  res.json({
    messages,
    count: metadata?.count ?? 0,
    limit: metadata?.take ?? req.validatedQuery.limit,
    offset: metadata?.skip ?? req.validatedQuery.offset,
  })
}

export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostAdminInboxConversationMessageSchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const response =
    req.validatedBody.type === "private_note"
      ? await inboxService.createPrivateNote({
          conversationId: req.params.id,
          text: req.validatedBody.text,
          actorId: req.auth_context?.actor_id,
        })
      : await inboxService.sendInboxMessage({
          conversationId: req.params.id,
          text: req.validatedBody.text,
        })

  res.status(200).json({
    message: response.message,
  })
}
