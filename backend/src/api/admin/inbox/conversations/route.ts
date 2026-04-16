import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

export const GetAdminInboxConversationsSchema = createFindParams()

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const {
    data: conversations,
    metadata: { count, take, skip } = {
      count: 0,
      take: 20,
      skip: 0,
    },
  } = await query.graph({
    entity: "conversation",
    ...req.queryConfig,
  })

  res.json({
    conversations,
    count,
    limit: take,
    offset: skip,
  })
}
