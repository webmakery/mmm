import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { EMAIL_MARKETING_MODULE } from "../../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../../modules/email-marketing/service"

export const PostAdminCampaignAnalyticsEventsSchema = z.object({
  events: z
    .array(
      z.object({
        subscriber_id: z.string().min(1).optional(),
        subscriber_email: z.string().email().optional(),
        provider_message_id: z.string().min(1).optional(),
        status: z.enum(["sent", "delivered", "opened", "clicked", "failed"]),
        event_at: z.coerce.date().optional(),
        error_message: z.string().optional(),
        metadata: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .min(1),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminCampaignAnalyticsEventsSchema>>, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const campaignId = req.params.id

  logger.info(`[email-marketing] POST analytics events start campaign_id=${campaignId} events=${req.validatedBody.events.length}`)

  const results = await Promise.all(
    req.validatedBody.events.map((event) =>
      service.applyCampaignDeliveryEvent({
        campaign_id: campaignId,
        subscriber_id: event.subscriber_id,
        subscriber_email: event.subscriber_email,
        provider_message_id: event.provider_message_id,
        status: event.status,
        event_at: event.event_at,
        error_message: event.error_message,
        metadata: event.metadata,
      })
    )
  )

  const updatedCount = results.filter((result) => result.updated).length
  logger.info(`[email-marketing] POST analytics events success campaign_id=${campaignId} updated=${updatedCount}/${results.length}`)

  res.status(200).json({
    campaign_id: campaignId,
    updated_count: updatedCount,
    skipped_count: results.length - updatedCount,
    results,
  })
}
