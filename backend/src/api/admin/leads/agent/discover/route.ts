import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { buildLeadAgentService } from "../../../../../modules/lead/agent/service"

export const PostAdminLeadAgentDiscoverSchema = z.object({
  query: z.string().min(2),
  location: z.string().optional(),
  max_results: z.coerce.number().min(1).max(50).default(20),
  min_score: z.coerce.number().min(1).max(100).default(65),
  follow_up_owner_email: z.string().email().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminLeadAgentDiscoverSchema>>,
  res: MedusaResponse
) {
  const agentService = buildLeadAgentService(req.scope)

  const qualified = await agentService.discoverScoreAndQueue(req.validatedBody)

  res.json({
    qualified,
    count: qualified.length,
  })
}
