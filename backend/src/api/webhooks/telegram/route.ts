import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import InboxModuleService from "../../../modules/inbox/service"
import { INBOX_MODULE } from "../../../modules/inbox"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const payload = (req.body || {}) as Record<string, unknown>

  const result = await inboxService.ingestTelegramWebhook(payload)

  res.status(200).json(result)
}
