import { normalizeTelegramWebhookEvent } from "../../adapters/meta-normalizers"
import { ChannelWebhookResult, SendMessageInput, SendMessageResult } from "../types"
import { buildTelegramExternalMessageId, parseTelegramExternalMessageId } from "./message-id"

type TelegramError = {
  description?: string
}

class TelegramProvider {
  private botToken_?: string
  private botId_?: string

  constructor(config?: { botToken?: string; botId?: string }) {
    this.botToken_ = config?.botToken || process.env.TELEGRAM_BOT_TOKEN
    this.botId_ = config?.botId || process.env.TELEGRAM_BOT_ID
  }

  parseWebhookPayload(payload: Record<string, unknown>): ChannelWebhookResult {
    return normalizeTelegramWebhookEvent(payload, this.botId_)
  }

  async sendMessage(input: SendMessageInput): Promise<SendMessageResult> {
    if (!this.botToken_) {
      throw new Error("Missing TELEGRAM_BOT_TOKEN for outbound Telegram replies.")
    }

    const endpoint = `https://api.telegram.org/bot${this.botToken_}/sendMessage`
    const { messageId: contextMessageId } = parseTelegramExternalMessageId(input.contextMessageId || "")

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: input.to,
        text: input.text,
        ...(contextMessageId ? { reply_to_message_id: Number(contextMessageId) || undefined } : {}),
      }),
    })

    const responseBody = (await response.json().catch(() => ({}))) as Record<string, unknown> & TelegramError

    if (!response.ok || responseBody.ok === false) {
      const errorMessage = responseBody?.description || `Telegram API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    const result = (responseBody.result || {}) as Record<string, unknown>
    const rawMessageId = String(result.message_id || "")

    if (!rawMessageId) {
      throw new Error("Telegram API did not return a message id.")
    }

    const chat = (result.chat || {}) as Record<string, unknown>
    const chatId = String(chat.id || input.to || "")

    if (!chatId) {
      throw new Error("Telegram API did not return a chat id.")
    }

    const externalMessageId = buildTelegramExternalMessageId(chatId, rawMessageId)

    return {
      channel: "telegram",
      externalMessageId,
      rawResponse: responseBody,
    }
  }
}

export default TelegramProvider
