import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetAdminInboxConversationMessagesSchema = createFindParams()

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const {
    data: messages,
    metadata: { count, take, skip } = {
      count: 0,
      take: 50,
      skip: 0,
    },
  } = await query.graph({
    entity: "message",
    ...req.queryConfig,
    filters: {
      ...(req.filterableFields || {}),
      conversation_id: [req.params.id],
    },
  })

  res.json({
    messages,
    count,
    limit: take,
    offset: skip,
  })
}
