import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
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
  const existingSubscriber = await service.retrieveSubscriber(req.params.id)

  const subscriber = await service.createOrUpdateSubscriber({
    email: existingSubscriber.email,
    first_name: req.validatedBody.first_name ?? existingSubscriber.first_name,
    last_name: req.validatedBody.last_name ?? existingSubscriber.last_name,
    status: (req.validatedBody.status as "active" | "unsubscribed" | "bounced" | undefined) ?? existingSubscriber.status,
    tags: req.validatedBody.tags ?? (existingSubscriber.tags as Record<string, unknown>) ?? {},
    source: req.validatedBody.source ?? existingSubscriber.source,
    metadata:
      (req.validatedBody.metadata as Record<string, unknown> | null | undefined) ??
      ((existingSubscriber.metadata as Record<string, unknown>) || null),
  })

  if (req.validatedBody.status === "unsubscribed" || req.validatedBody.status === "bounced") {
    await service.updateSubscribers({
      id: subscriber.id,
      ...(req.validatedBody.status === "unsubscribed"
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
