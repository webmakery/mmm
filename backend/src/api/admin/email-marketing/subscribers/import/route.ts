import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INotificationModuleService } from "@medusajs/framework/types"
import { z } from "@medusajs/framework/zod"
import { Modules } from "@medusajs/framework/utils"
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
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

  const subscribers = await Promise.all(
    req.validatedBody.subscribers.map((subscriber) =>
      service.createOrUpdateSubscriber({
        ...subscriber,
        status: "active",
        tags: subscriber.tags || {},
        notification_module_service: notificationModuleService,
      })
    )
  )

  res.json({ imported_count: subscribers.length, subscribers })
}
