import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"

export const PostAdminEmailTemplatePreviewSchema = z.object({
  template_id: z.string(),
  variables: z.record(z.string(), z.string()).default({}),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailTemplatePreviewSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const preview = await service.renderTemplatePreview(req.validatedBody.template_id, req.validatedBody.variables)

  res.json({ preview })
}
