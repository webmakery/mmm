import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

const CampaignAudienceFilterSchema = z
  .object({
    include_tags: z.array(z.string().min(1)).default([]),
    exclude_tags: z.array(z.string().min(1)).default([]),
    tag_match_mode: z.enum(["any", "all"]).default("any"),
  })
  .default({})

export const GetAdminEmailCampaignsSchema = z.object({
  status: z.enum(["draft", "scheduled", "automated", "processing", "sent", "failed"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export const PostAdminEmailCampaignSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  sender_name: z.string().min(1),
  sender_email: z.string().email(),
  template_id: z.string(),
  scheduled_at: z.string().datetime().optional().nullable(),
  audience_filter: CampaignAudienceFilterSchema.optional(),
  status: z.enum(["draft", "scheduled", "automated"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminEmailCampaignsSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const query = req.validatedQuery as z.infer<typeof GetAdminEmailCampaignsSchema>

  const campaigns = await service.listEmailCampaigns(
    {
      ...(query.status ? { status: query.status } : {}),
    },
    {
      take: query.limit,
      skip: query.offset,
    }
  )

  const count = await service.countCampaigns(query.status)

  res.json({ campaigns, count, limit: query.limit, offset: query.offset })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailCampaignSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const campaign = await service.createCampaignDraft(req.validatedBody)

  res.json({ campaign })
}
