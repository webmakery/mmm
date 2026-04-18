import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { LEAD_MODULE } from "../../../../modules/lead"
import LeadModuleService from "../../../../modules/lead/service"
import { updateLeadWorkflow } from "../../../../workflows/lead"

export const PostAdminUpdateLeadSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  google_maps_uri: z.string().url().optional(),
  company: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "won", "lost"]).optional(),
  stage_id: z.string().optional(),
  owner_user_id: z.string().optional(),
  value_estimate: z.number().optional(),
  notes_summary: z.string().optional(),
  next_follow_up_at: z.string().datetime().optional(),
  customer_id: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const {
    data: [lead],
  } = await query.graph({
    entity: "lead",
    fields: ["*", "stage.*", "activities.*"],
    filters: {
      id: req.params.id,
    },
  })

  res.json({ lead })
}

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminUpdateLeadSchema>>,
  res: MedusaResponse
) {
  const { result } = await updateLeadWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      ...req.validatedBody,
    },
  })

  res.json(result)
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  await leadService.deleteLeads(req.params.id)

  res.status(200).json({
    id: req.params.id,
    object: "lead",
    deleted: true,
  })
}
