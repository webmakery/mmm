import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { moveLeadStageWorkflow } from "../../../../../workflows/lead"

export const PostAdminMoveLeadStageSchema = z.object({
  stage_id: z.string(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  created_by: z.string().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminMoveLeadStageSchema>>,
  res: MedusaResponse
) {
  const { result } = await moveLeadStageWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json(result)
}
