import {
  InboxProviderAdapter,
  ProviderWebhookResult,
  SendReplyInput,
  SendReplyResult,
} from "../types"

type WhatsappConfig = {
  graphApiVersion: string
  accessToken?: string
}

type GraphError = {
  error?: {
    message?: string
  }
}

const toDate = (value?: string | number): Date | null => {
  if (typeof value === "number") {
    return new Date(value * 1000)
  }

  if (typeof value === "string") {
    const parsed = Number(value)

    if (!Number.isNaN(parsed)) {
      return new Date(parsed * 1000)
    }
  }

  return null
}

class WhatsappProvider implements InboxProviderAdapter {
  provider: "whatsapp" = "whatsapp"
  private graphApiVersion_: string
  private accessToken_?: string

  constructor(config?: Partial<WhatsappConfig>) {
    this.graphApiVersion_ = config?.graphApiVersion || process.env.WHATSAPP_GRAPH_API_VERSION || "v22.0"
    this.accessToken_ = config?.accessToken || process.env.WHATSAPP_ACCESS_TOKEN
  }

  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookResult {
    const inboundMessages: ProviderWebhookResult["inboundMessages"] = []
    const statusEvents: ProviderWebhookResult["statusEvents"] = []

    const entries = Array.isArray(payload.entry) ? payload.entry : []

    for (const entry of entries) {
      if (!entry || typeof entry !== "object") {
        continue
      }

      const changes = Array.isArray((entry as Record<string, unknown>).changes)
        ? ((entry as Record<string, unknown>).changes as Array<Record<string, unknown>>)
        : []

      for (const change of changes) {
        const value = change?.value as Record<string, unknown> | undefined

        if (!value || typeof value !== "object") {
          continue
        }

        const metadata = (value.metadata || {}) as Record<string, unknown>
        const contacts = Array.isArray(value.contacts)
          ? (value.contacts as Array<Record<string, unknown>>)
          : []
        const messages = Array.isArray(value.messages)
          ? (value.messages as Array<Record<string, unknown>>)
          : []
        const statuses = Array.isArray(value.statuses)
          ? (value.statuses as Array<Record<string, unknown>>)
          : []

        const accountId = String(metadata.phone_number_id || "")

        for (const message of messages) {
          const from = String(message.from || "")
          const messageId = String(message.id || "")

          if (!from || !messageId || !accountId) {
            continue
          }

          const contact = contacts.find((item) => String(item.wa_id || "") === from)
          const profile = (contact?.profile || {}) as Record<string, unknown>
          const text = (message.text || {}) as Record<string, unknown>
          const content = typeof text.body === "string" ? text.body : null
          const type = String(message.type || "")

          inboundMessages.push({
            provider: "whatsapp",
            providerMessageId: messageId,
            accountId,
            customerIdentifier: from,
            customerDisplayName: typeof profile.name === "string" ? profile.name : null,
            timestamp: toDate(message.timestamp as string | undefined),
            content,
            messageType: type === "text" ? "text" : "unsupported",
            rawPayload: message,
          })
        }

        for (const status of statuses) {
          const providerMessageId = String(status.id || "")
          const statusName = String(status.status || "")
          const eventId = `${providerMessageId}:${statusName}:${String(status.timestamp || "")}`

          if (!providerMessageId || !accountId) {
            continue
          }

          if (!["sent", "delivered", "read", "failed"].includes(statusName)) {
            continue
          }

          const errors = Array.isArray(status.errors)
            ? (status.errors as Array<Record<string, unknown>>)
            : []

          statusEvents.push({
            provider: "whatsapp",
            eventId,
            providerMessageId,
            accountId,
            status: statusName as "sent" | "delivered" | "read" | "failed",
            timestamp: toDate(status.timestamp as string | undefined),
            errorMessage: typeof errors[0]?.message === "string" ? errors[0].message : null,
            rawPayload: status,
          })
        }
      }
    }

    return {
      inboundMessages,
      statusEvents,
      rawPayload: payload,
    }
  }

  async sendReply(input: SendReplyInput): Promise<SendReplyResult> {
    if (!this.accessToken_) {
      throw new Error("Missing WHATSAPP_ACCESS_TOKEN for outbound WhatsApp replies.")
    }

    const endpoint = `https://graph.facebook.com/${this.graphApiVersion_}/${input.accountId}/messages`

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

    const providerMessageId = String(messages[0]?.id || "")

    if (!providerMessageId) {
      throw new Error("WhatsApp API did not return a message id.")
    }

    return {
      provider: "whatsapp",
      providerMessageId,
      rawResponse: responseBody,
    }
  }
}

export default WhatsappProvider
