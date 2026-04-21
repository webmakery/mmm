import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../../modules/email-marketing/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const service: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

  const campaign = await service.queueCampaignSend(req.params.id, notificationModuleService)

  res.json({ campaign })
}
