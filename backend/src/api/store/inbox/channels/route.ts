import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const channelCatalog: Record<string, { id: string; type: string; label: string; description: string; onboarding_required: boolean }> = {
  web_chat: {
    id: "web_chat",
    type: "web_chat",
    label: "Live Chat",
    description: "Chat with our support team",
    onboarding_required: true,
  },
  whatsapp: {
    id: "whatsapp",
    type: "whatsapp",
    label: "WhatsApp",
    description: "Continue in WhatsApp",
    onboarding_required: false,
  },
  messenger: {
    id: "messenger",
    type: "messenger",
    label: "Messenger",
    description: "Continue in Messenger",
    onboarding_required: false,
  },
  instagram: {
    id: "instagram",
    type: "instagram",
    label: "Instagram",
    description: "Continue in Instagram",
    onboarding_required: false,
  },
  telegram: {
    id: "telegram",
    type: "telegram",
    label: "Telegram",
    description: "Continue in Telegram",
    onboarding_required: false,
  },
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: channelAccounts } = await query.graph({
    entity: "channel_account",
    fields: ["provider"],
  })

  const providers = new Set<string>(["web_chat", ...(channelAccounts || []).map((account) => account.provider)])

  const channels = [...providers]
    .map((provider) => channelCatalog[provider])
    .filter(Boolean)

  res.status(200).json({
    channels,
  })
}
