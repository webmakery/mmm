import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { z } from "@medusajs/framework/zod"
import { buildLeadAgentService } from "../../../../../modules/lead/agent/service"

export const PostAdminLeadAgentDiscoverSchema = z.object({
  query: z.string().min(2),
  location: z.string().trim().min(1, "location is required"),
  max_results: z.coerce.number().min(1).max(50).default(20),
  min_score: z.coerce.number().min(1).max(100).default(65),
  follow_up_owner_email: z.string().email().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminLeadAgentDiscoverSchema>>,
  res: MedusaResponse
) {
  const parseResult = PostAdminLeadAgentDiscoverSchema.safeParse(req.validatedBody ?? req.body ?? {})
  if (!parseResult.success) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, parseResult.error.issues[0]?.message || "Invalid request body")
  }

  const payload = parseResult.data
  req.scope.resolve<{ info: (message: string) => void }>(ContainerRegistrationKeys.LOGGER).info(
    `[lead-agent] action=route_discovery_payload details=${JSON.stringify({ payload })}`
  )

  const agentService = buildLeadAgentService(req.scope)

  const qualified = await agentService.discoverScoreAndQueue(payload)

  res.json({
    qualified,
    count: qualified.length,
  })
}
