import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"

export const PostAdminEmailSubscriberImportSchema = z.object({
  subscribers: z.array(
    z.object({
      email: z.string().email(),
      first_name: z.string().optional().nullable(),
      last_name: z.string().optional().nullable(),
      tags: z.record(z.string(), z.unknown()).optional(),
      source: z.string().optional().nullable(),
    })
  ),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailSubscriberImportSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)

  const subscribers = await Promise.all(
    req.validatedBody.subscribers.map((subscriber) =>
      service.createOrUpdateSubscriber({
        ...subscriber,
        tags: subscriber.tags || {},
      })
    )
  )

  res.json({ imported_count: subscribers.length, subscribers })
}
