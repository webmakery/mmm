import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"

export const PostAdminEmailTemplateUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  subject: z.string().min(1).optional(),
  html_content: z.string().min(1).optional(),
  text_content: z.string().optional().nullable(),
  variables: z.record(z.string(), z.unknown()).optional(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const PostAdminEmailTemplatePreviewSchema = z.object({
  variables: z.record(z.string(), z.string()).default({}),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const template = await service.retrieveEmailTemplate(req.params.id)
  res.json({ template })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailTemplateUpdateSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const template = await service.updateEmailTemplates({ id: req.params.id, ...req.validatedBody } as any)
  res.json({ template })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  await service.deleteEmailTemplates(req.params.id)

  res.status(200).json({ id: req.params.id, object: "email_template", deleted: true })
}
