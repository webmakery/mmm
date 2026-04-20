import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

export const PostStoreEmailUnsubscribeSchema = z.object({
  token: z.string().min(10),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostStoreEmailUnsubscribeSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const subscriber = await service.unsubscribeByToken(req.validatedBody.token)

  res.json({
    subscriber,
    message: "You have been unsubscribed.",
  })
}
