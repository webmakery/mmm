import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const GetStoreWebChatMessagesSchema = z.object({
  session_id: z.string().trim().min(1),
  after: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
})

export const PostStoreWebChatMessageSchema = z.object({
  session_id: z.string().trim().min(1),
  text: z.string().trim().min(1),
})

const serializeMessage = (message: any) => ({
  id: message.id,
  channel: message.channel,
  direction: message.direction,
  message_type: message.message_type,
  text: message.text,
  content: message.content,
  status: message.status,
  sent_at: message.sent_at,
  received_at: message.received_at,
  created_at: message.created_at,
  participant: message.participant
    ? {
        id: message.participant.id,
        role: message.participant.role,
        display_name: message.participant.display_name,
      }
    : null,
})

export async function GET(req: MedusaRequest<z.infer<typeof GetStoreWebChatMessagesSchema>>, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const session = await inboxService.resolveWebChatSession(String(req.validatedQuery.session_id))

  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    })
  }

  const query = req.scope.resolve("query")

  const afterRaw = req.validatedQuery.after
  const after = typeof afterRaw === "string" ? new Date(afterRaw) : null
  const isIncrementalRequest = Boolean(after && !Number.isNaN(after.getTime()))

  const { data } = await query.graph({
    entity: "message",
    fields: [
      "id",
      "channel",
      "direction",
      "message_type",
      "text",
      "content",
      "status",
      "sent_at",
      "received_at",
      "created_at",
      "participant.id",
      "participant.role",
      "participant.display_name",
    ],
    filters: {
      conversation_id: session.conversation_id,
    },
    pagination: {
      take: req.validatedQuery.limit,
      order: {
        created_at: isIncrementalRequest ? "DESC" : "ASC",
      },
    },
  })

  const messages = data.filter((message: any) => {
    if (!after || Number.isNaN(after.getTime())) {
      return true
    }

    return new Date(String(message.created_at)).getTime() > after.getTime()
  })

  const orderedMessages = isIncrementalRequest
    ? messages
        .slice()
        .sort(
          (a: any, b: any) =>
            new Date(String(a.created_at)).getTime() - new Date(String(b.created_at)).getTime()
        )
    : messages

  return res.status(200).json({
    session,
    messages: orderedMessages.map(serializeMessage),
  })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostStoreWebChatMessageSchema>>, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)

  const response = await inboxService.sendWebChatInboundMessage({
    sessionId: req.validatedBody.session_id,
    text: req.validatedBody.text,
  })

  return res.status(200).json({
    message: serializeMessage(response.message),
  })
}
