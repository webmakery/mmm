import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_MARKETING_MODULE } from "../../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../../modules/email-marketing/service"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const campaignId = req.params.id

  logger.info(`[email-marketing] DELETE analytics logs start campaign_id=${campaignId}`)

  const result = await service.clearCampaignAnalyticsLogs(campaignId)

  logger.info(
    `[email-marketing] DELETE analytics logs success campaign_id=${campaignId} cleared=${result.cleared_count} archived_total=${result.archived_analytics.total_recipients}`
  )

  res.status(200).json({
    campaign_id: campaignId,
    object: "email_campaign_analytics_logs",
    deleted: true,
    ...result,
  })
}
