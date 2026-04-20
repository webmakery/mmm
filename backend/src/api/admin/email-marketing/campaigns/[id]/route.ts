import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"

export const PostAdminEmailCampaignUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  subject: z.string().min(1).optional(),
  sender_name: z.string().min(1).optional(),
  sender_email: z.string().email().optional(),
  template_id: z.string().optional(),
  scheduled_at: z.string().datetime().optional().nullable(),
  audience_filter: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(["draft", "scheduled", "failed"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const campaign = await service.retrieveEmailCampaign(req.params.id)

  res.json({ campaign })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailCampaignUpdateSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const body = req.validatedBody as z.infer<typeof PostAdminEmailCampaignUpdateSchema>
  const campaign = await service.updateEmailCampaigns({
    id: req.params.id,
    ...body,
    ...(body.scheduled_at !== undefined
      ? { scheduled_at: body.scheduled_at ? new Date(body.scheduled_at) : null }
      : {}),
  } as any)

  res.json({ campaign })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  await service.deleteEmailCampaigns(req.params.id)

  res.status(200).json({ id: req.params.id, object: "email_campaign", deleted: true })
}
