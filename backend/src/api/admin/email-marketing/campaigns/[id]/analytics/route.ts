import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_MARKETING_MODULE } from "../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../modules/email-marketing/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const analytics = await service.getCampaignAnalytics(req.params.id)

  const logs = await service.listEmailCampaignLogs({ campaign_id: req.params.id }, { take: 250, order: { created_at: "DESC" } })

  res.json({ analytics, logs })
}
