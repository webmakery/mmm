import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import crypto from "node:crypto"
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
  const appSecret = process.env.WHATSAPP_APP_SECRET

  if (!appSecret) {
    return res.status(500).json({ message: "Missing WHATSAPP_APP_SECRET configuration." })
  }

  const signatureHeader = req.headers["x-hub-signature-256"]

  if (!signatureHeader || Array.isArray(signatureHeader)) {
    return res.status(400).json({ message: "Missing x-hub-signature-256 header." })
  }

  const providedSignature = signatureHeader.trim()

  if (!providedSignature.startsWith("sha256=")) {
    return res.status(400).json({ message: "Invalid x-hub-signature-256 header format." })
  }

  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({ message: "Expected raw request body for signature verification." })
  }

  const rawBody = req.body
  const expectedSignature = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody).digest("hex")}`

  if (providedSignature.length !== expectedSignature.length) {
    return res.status(401).json({ message: "Invalid WhatsApp webhook signature." })
  }

  const signaturesMatch = crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(expectedSignature))

  if (!signaturesMatch) {
    return res.status(401).json({ message: "Invalid WhatsApp webhook signature." })
  }

  let payload: Record<string, unknown>

  try {
    payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>
  } catch {
    return res.status(400).json({ message: "Invalid JSON payload." })
  }

  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const result = await inboxService.ingestWhatsappWebhook(payload)

  res.status(200).json({
    received: true,
    ...result,
  })
}
