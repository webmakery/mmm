import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_MARKETING_MODULE } from "../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../modules/email-marketing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const logger = req.scope.resolve("logger")
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const campaignId = req.params.id

  logger.info(`[email-marketing] GET analytics start campaign_id=${campaignId}`)

  const analytics = await service.getCampaignAnalytics(campaignId)
  const logs = await service.listCampaignEmailAnalyticsLogs(campaignId)

  logger.info(
    `[email-marketing] GET analytics success campaign_id=${campaignId} recipients=${analytics.total_recipients} sent=${analytics.sent_count} delivered=${analytics.delivered_count} failed=${analytics.failed_count} logs=${logs.length}`
  )

  res.json({ analytics, logs })
}
