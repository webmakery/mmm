import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { EMAIL_MARKETING_MODULE } from "../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../modules/email-marketing/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)

  const campaign = await service.queueCampaignSend(req.params.id)

  res.json({ campaign })
}
