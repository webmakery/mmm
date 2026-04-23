import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INotificationModuleService } from "@medusajs/framework/types"
import { z } from "@medusajs/framework/zod"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"

export const PostAdminEmailSubscriberUpdateSchema = z.object({
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  status: z.enum(["active", "unsubscribed", "bounced"]).optional(),
  tags: z.record(z.string(), z.unknown()).optional(),
  source: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const subscriber = await service.retrieveSubscriber(req.params.id)

  res.json({ subscriber })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminEmailSubscriberUpdateSchema>>, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)
  const existingSubscriber = await service.retrieveSubscriber(req.params.id)
  const body = req.validatedBody as z.infer<typeof PostAdminEmailSubscriberUpdateSchema>

  const subscriber = await service.createOrUpdateSubscriber({
    email: existingSubscriber.email,
    first_name: body.first_name ?? existingSubscriber.first_name,
    last_name: body.last_name ?? existingSubscriber.last_name,
    status: (body.status as "active" | "unsubscribed" | "bounced" | undefined) ?? existingSubscriber.status,
    tags: body.tags ?? (existingSubscriber.tags as Record<string, unknown>) ?? {},
    source: body.source ?? existingSubscriber.source,
    metadata:
      (body.metadata as Record<string, unknown> | null | undefined) ??
      ((existingSubscriber.metadata as Record<string, unknown>) || null),
    notification_module_service: notificationModuleService,
  })

  if (body.status === "unsubscribed" || body.status === "bounced") {
    await service.updateSubscribers({
      id: subscriber.id,
      ...(body.status === "unsubscribed"
        ? { unsubscribed_at: new Date(), bounced_at: null }
        : { bounced_at: new Date(), unsubscribed_at: null }),
    } as any)
  }

  res.json({ subscriber })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  await service.deleteSubscribers(req.params.id)

  res.status(200).json({ id: req.params.id, object: "email_subscriber", deleted: true })
}
