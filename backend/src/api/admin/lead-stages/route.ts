import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"

export const PostAdminCreateLeadStageSchema = z.object({
  name: z.string(),
  slug: z.string(),
  sort_order: z.number().optional(),
  color: z.string().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  const stages = await leadService.listLeadStages({}, { order: { sort_order: "ASC" } })

  res.json({ stages })
}

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminCreateLeadStageSchema>>,
  res: MedusaResponse
) {
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  const stage = await leadService.createLeadStages({
    ...req.validatedBody,
    sort_order: req.validatedBody.sort_order ?? 0,
  })

  res.json({ stage })
}
