import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import InboxModuleService from "../../../../modules/inbox/service"
import { INBOX_MODULE } from "../../../../modules/inbox"

const verifyMetaWebhook = (req: MedusaRequest, res: MedusaResponse, token: string | undefined) => {
  const mode = req.query["hub.mode"]
  const challenge = req.query["hub.challenge"]
  const verifyToken = req.query["hub.verify_token"]

  if (mode !== "subscribe" || typeof challenge !== "string" || typeof verifyToken !== "string") {
    return res.status(400).json({ message: "Invalid webhook verification query parameters." })
  }

  if (!token) {
    return res.status(500).json({ message: "Missing META_VERIFY_TOKEN configuration." })
  }

  if (verifyToken !== token) {
    return res.status(403).json({ message: "Invalid webhook verify token." })
  }

  return res.status(200).send(challenge)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  return verifyMetaWebhook(req, res, process.env.INSTAGRAM_VERIFY_TOKEN || process.env.META_VERIFY_TOKEN)
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const payload = (req.body || {}) as Record<string, unknown>

  const result = await inboxService.ingestInstagramWebhook(payload)

  res.status(200).json(result)
}
