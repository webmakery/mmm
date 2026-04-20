import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

export const GetAdminEmailTemplatesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export const PostAdminEmailTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  subject: z.string().min(1),
  html_content: z.string().min(1),
  text_content: z.string().optional().nullable(),
  variables: z.record(z.string(), z.unknown()).default({}),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const PostAdminTemplatePreviewSchema = z.object({
  template_id: z.string(),
  variables: z.record(z.string(), z.string()).default({}),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminEmailTemplatesSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const query = req.validatedQuery as z.infer<typeof GetAdminEmailTemplatesSchema>
  const templates = await service.listEmailTemplates({}, { take: query.limit, skip: query.offset })
  const count = await service.countTemplates()

  res.json({ templates, count, limit: query.limit, offset: query.offset })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailTemplateSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const template = await service.createEmailTemplates({
    ...req.validatedBody,
    variables: req.validatedBody.variables,
  })

  res.json({ template })
}
