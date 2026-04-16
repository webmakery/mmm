import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import InboxModuleService from "../../../modules/inbox/service"
import { INBOX_MODULE } from "../../../modules/inbox"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const mode = req.query["hub.mode"]
  const challenge = req.query["hub.challenge"]
  const verifyToken = req.query["hub.verify_token"]

  if (mode !== "subscribe" || typeof challenge !== "string" || typeof verifyToken !== "string") {
    return res.status(400).json({ message: "Invalid webhook verification query parameters." })
  }

  if (!process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(500).json({ message: "Missing WHATSAPP_VERIFY_TOKEN configuration." })
  }

  if (verifyToken !== process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(403).json({ message: "Invalid webhook verify token." })
  }

  return res.status(200).send(challenge)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)

  const payload = (req.body || {}) as Record<string, unknown>

  const result = await inboxService.ingestWhatsappWebhook(payload)

  res.status(200).json({
    received: true,
    ...result,
  })
}
