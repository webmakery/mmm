import { normalizeWhatsAppWebhookEvent } from "../../adapters/meta-normalizers"
import { ChannelWebhookResult, SendMessageInput, SendMessageResult } from "../types"

type WhatsappConfig = {
  graphApiVersion: string
  accessToken?: string
}

type GraphError = {
  error?: {
    message?: string
  }
}

class WhatsappProvider {
  private graphApiVersion_: string
  private accessToken_?: string

  constructor(config?: Partial<WhatsappConfig>) {
    this.graphApiVersion_ = config?.graphApiVersion || process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0"
    this.accessToken_ = config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN
  }

  parseWebhookPayload(payload: Record<string, unknown>): ChannelWebhookResult {
    return normalizeWhatsAppWebhookEvent(payload)
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    if (!this.accessToken_) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN for outbound WhatsApp replies.")
    }

    const accountId = input.accountId || process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accountId) {
      throw new Error("Missing WhatsApp account id for outbound message.")
    }

    const endpoint = `https://graph.facebook.com/${this.graphApiVersion_}/${accountId}/messages`

    const payload: Record<string, unknown> = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: input.to,
      type: "text",
      text: {
        body: input.text,
      },
    }

    if (input.contextMessageId) {
      payload.context = {
        message_id: input.contextMessageId,
      }
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.accessToken_}`,
      },
      body: JSON.stringify(payload),
    })

    const responseBody = (await response.json().catch(() => ({}))) as Record<string, unknown> & GraphError

    if (!response.ok) {
      const errorMessage = responseBody?.error?.message || `WhatsApp API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    const messages = Array.isArray(responseBody.messages)
      ? (responseBody.messages as Array<Record<string, unknown>>)
      : []

    const externalMessageId = String(messages[0]?.id || "")

    if (!externalMessageId) {
      throw new Error("WhatsApp API did not return a message id.")
    }

    return {
      channel: "whatsapp",
      externalMessageId,
      rawResponse: responseBody,
    }
  }
}

export default WhatsappProvider
