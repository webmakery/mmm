import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

export const GetAdminInboxConversationsSchema = z.object({
  q: z.string().optional(),
  channel: z.enum(["whatsapp", "messenger", "instagram"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(
  req: AuthenticatedMedusaRequest<z.infer<typeof GetAdminInboxConversationsSchema>>,
  res: MedusaResponse
) {
  const query = req.scope.resolve("query")

  const q = typeof req.validatedQuery.q === "string" ? req.validatedQuery.q.trim() : undefined

  const filters: Record<string, unknown> = {}
  const channel = req.validatedQuery.channel

  if (channel) {
    filters.channel = channel
  }

  if (q) {
    filters.$or = [
      { customer_name: { $ilike: `%${q}%` } },
      { customer_phone: { $ilike: `%${q}%` } },
      { customer_handle: { $ilike: `%${q}%` } },
      { last_message_preview: { $ilike: `%${q}%` } },
    ]
  }

  const { data: conversations, metadata } = await query.graph({
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
    ],
    pagination: {
      skip: req.validatedQuery.offset,
      take: req.validatedQuery.limit,
      order: {
        last_message_at: "DESC",
        created_at: "DESC",
      },
    },
    filters,
  })

  res.json({
    conversations,
    count: metadata?.count ?? 0,
    limit: metadata?.take ?? req.validatedQuery.limit,
    offset: metadata?.skip ?? req.validatedQuery.offset,
  })
}
