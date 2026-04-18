import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { ContainerRegistrationKeys, MedusaError } from "@medusajs/framework/utils"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { createLeadWorkflow } from "../../../workflows/lead"
import { resolveLeadStageId } from "./utils"

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
  metadata: z.record(z.unknown()).optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminLeadsSchema>>, res: MedusaResponse) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  const sanitizedFilters = {
    q: req.validatedQuery.q?.trim() || undefined,
    stage_id: req.validatedQuery.stage_id?.trim() || undefined,
    status: req.validatedQuery.status,
    owner_user_id: req.validatedQuery.owner_user_id?.trim() || undefined,
    source: req.validatedQuery.source?.trim() || undefined,
    follow_up: req.validatedQuery.follow_up,
  }

  logger.info(
    `[CRM] GET /admin/leads query=${JSON.stringify({
      ...sanitizedFilters,
      limit: req.validatedQuery.limit,
      offset: req.validatedQuery.offset,
    })}`
  )

  const { leads, count } = await leadService.listLeadsWithFilters(sanitizedFilters, {
    limit: req.validatedQuery.limit,
    offset: req.validatedQuery.offset,
  })

  logger.info(`[CRM] GET /admin/leads returned=${leads.length} count=${count}`)

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
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const leadService: LeadModuleService = req.scope.resolve(LEAD_MODULE)

  try {
    const stageId = await resolveLeadStageId({
      leadService,
      stageId: req.validatedBody.stage_id,
    })

    const { result } = await createLeadWorkflow(req.scope).run({
      input: {
        ...req.validatedBody,
        stage_id: stageId,
      },
    })

    res.json(result)
  } catch (error) {
    logger.error(`[CRM] Failed to create lead: ${error instanceof Error ? error.message : String(error)}`)

    if (error instanceof MedusaError) {
      throw error
    }

    throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, "Failed to create lead")
  }
}
