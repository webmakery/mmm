import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { createLeadWorkflow } from "../../../workflows/lead"

export const GetAdminLeadsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
  stage_id: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  owner_user_id: z.string().optional(),
  source: z.string().optional(),
  follow_up: z.enum(["overdue", "today"]).optional(),
})

export const PostAdminCreateLeadSchema = z.object({
  first_name: z.string(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  stage_id: z.string().optional(),
  owner_user_id: z.string().optional(),
  value_estimate: z.number().optional(),
  notes_summary: z.string().optional(),
  next_follow_up_at: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminLeadsSchema>>, res: MedusaResponse) {
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  const { leads, count } = await leadService.listLeadsWithFilters(
    {
      q: req.validatedQuery.q,
      stage_id: req.validatedQuery.stage_id,
      status: req.validatedQuery.status,
      owner_user_id: req.validatedQuery.owner_user_id,
      source: req.validatedQuery.source,
      follow_up: req.validatedQuery.follow_up,
    },
    {
      limit: req.validatedQuery.limit,
      offset: req.validatedQuery.offset,
    }
  )

  res.json({
    leads,
    count,
    limit: req.validatedQuery.limit,
    offset: req.validatedQuery.offset,
  })
}

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminCreateLeadSchema>>,
  res: MedusaResponse
) {
  const { result } = await createLeadWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.json(result)
}
