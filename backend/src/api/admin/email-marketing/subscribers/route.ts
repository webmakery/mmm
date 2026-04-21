import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INotificationModuleService } from "@medusajs/framework/types"
import { z } from "@medusajs/framework/zod"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../modules/email-marketing/service"

export const GetAdminEmailSubscribersSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export const PostAdminEmailSubscriberSchema = z.object({
  email: z.string().email(),
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
  tags: z.record(z.string(), z.unknown()).default({}),
  source: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminEmailSubscribersSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const query = req.validatedQuery as z.infer<typeof GetAdminEmailSubscribersSchema>

  const result = await service.listSubscribersPaginated(
    {
      q: query.q,
      status: query.status,
    },
    {
      limit: query.limit,
      offset: query.offset,
    }
  )

  res.json({
    subscribers: result.subscribers,
    count: result.count,
    limit: query.limit,
    offset: query.offset,
  })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailSubscriberSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  const subscriber = await service.createOrUpdateSubscriber({
    ...req.validatedBody,
    notification_module_service: notificationModuleService,
  })

  res.json({ subscriber })
}
