import { ChannelWebhookResult, NormalizedWebhookMessage, NormalizedWebhookStatusEvent } from "../providers/types"
import { buildTelegramExternalMessageId } from "../providers/telegram/message-id"

export const normalizeProviderTimestamp = (
  value: number | string | Date | undefined,
  unit: "ms" | "s" = "ms",
  fallbackToNow = true
): Date | null => {
  if (value === undefined || value === null || value === "") {
    return fallbackToNow ? new Date() : null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? (fallbackToNow ? new Date() : null) : value
  }

  const parsed = typeof value === "string" ? Number(value) : value

  if (!Number.isFinite(parsed)) {
    return fallbackToNow ? new Date() : null
  }

  const date = new Date(unit === "s" ? parsed * 1000 : parsed)

  if (Number.isNaN(date.getTime())) {
    return fallbackToNow ? new Date() : null
  }

  return date
}

const getEntryChanges = (payload: Record<string, unknown>) => {
  const entries = Array.isArray(payload.entry) ? payload.entry : []

  return entries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") {
      return []
    }

    const changes = Array.isArray((entry as Record<string, unknown>).changes)
      ? ((entry as Record<string, unknown>).changes as Array<Record<string, unknown>>)
      : []

    return changes
      .map((change) => change?.value)
      .filter((value): value is Record<string, unknown> => Boolean(value && typeof value === "object"))
  })
}

export const normalizeWhatsAppWebhookEvent = (payload: Record<string, unknown>): ChannelWebhookResult => {
  const inboundMessages: NormalizedWebhookMessage[] = []
  const statusEvents: NormalizedWebhookStatusEvent[] = []

  for (const value of getEntryChanges(payload)) {
    const metadata = (value.metadata || {}) as Record<string, unknown>
    const contacts = Array.isArray(value.contacts) ? (value.contacts as Array<Record<string, unknown>>) : []
    const messages = Array.isArray(value.messages) ? (value.messages as Array<Record<string, unknown>>) : []
    const statuses = Array.isArray(value.statuses) ? (value.statuses as Array<Record<string, unknown>>) : []

    const accountId = String(metadata.phone_number_id || "")

    for (const message of messages) {
      const from = String(message.from || "")
      const externalMessageId = String(message.id || "")

      if (!from || !externalMessageId) {
        continue
      }

      const contact = contacts.find((item) => String(item.wa_id || "") === from)
      const profile = (contact?.profile || {}) as Record<string, unknown>
      const text = (message.text || {}) as Record<string, unknown>

      inboundMessages.push({
        channel: "whatsapp",
        externalUserId: from,
        externalThreadId: from,
        externalMessageId,
        customerName: typeof profile.name === "string" ? profile.name : null,
        customerPhone: from,
        text: typeof text.body === "string" ? text.body : null,
        timestamp: normalizeProviderTimestamp(message.timestamp as string | undefined, "s", false),
        rawPayload: message,
        accountId: accountId || null,
      })
    }

    for (const status of statuses) {
      const externalMessageId = String(status.id || "")
      const statusName = String(status.status || "")
      const eventId = `${externalMessageId}:${statusName}:${String(status.timestamp || "")}`

      if (!externalMessageId || !["sent", "delivered", "read", "failed"].includes(statusName)) {
        continue
      }

      const errors = Array.isArray(status.errors) ? (status.errors as Array<Record<string, unknown>>) : []

      statusEvents.push({
        channel: "whatsapp",
        externalMessageId,
        eventId,
        status: statusName as "sent" | "delivered" | "read" | "failed",
        timestamp: normalizeProviderTimestamp(status.timestamp as string | undefined, "s", false),
        errorMessage: typeof errors[0]?.message === "string" ? errors[0].message : null,
        rawPayload: status,
      })
    }
  }

  return {
    inboundMessages,
    statusEvents,
    rawPayload: payload,
  }
}

const normalizeMetaMessagingWebhookEvent = (
  payload: Record<string, unknown>,
  channel: "messenger" | "instagram"
): ChannelWebhookResult => {
  const inboundMessages: NormalizedWebhookMessage[] = []

  const entries = Array.isArray(payload.entry) ? payload.entry : []

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue
    }

    const entryObj = entry as Record<string, unknown>
    const entryId = String(entryObj.id || "")
    const messaging = Array.isArray(entryObj.messaging) ? (entryObj.messaging as Array<Record<string, unknown>>) : []

    for (const item of messaging) {
      const sender = (item.sender || {}) as Record<string, unknown>
      const recipient = (item.recipient || {}) as Record<string, unknown>
      const message = (item.message || {}) as Record<string, unknown>

      const externalUserId = String(sender.id || "")
      const externalThreadId = String(recipient.id || "") || externalUserId
      const externalMessageId = String(message.mid || "")

      if (!externalUserId || !externalMessageId) {
        continue
      }

      inboundMessages.push({
        channel,
        externalThreadId,
        externalUserId,
        externalMessageId,
        customerHandle: externalUserId,
        text: typeof message.text === "string" ? message.text : null,
        timestamp: normalizeProviderTimestamp(item.timestamp as number | undefined, "ms", true),
        rawPayload: item,
        pageId: channel === "messenger" ? (entryId || String(recipient.id || "") || null) : null,
        instagramAccountId: channel === "instagram" ? (entryId || String(recipient.id || "") || null) : null,
      })
    }
  }

  return {
    inboundMessages,
    statusEvents: [],
    rawPayload: payload,
  }
}

export const normalizeMessengerWebhookEvent = (payload: Record<string, unknown>): ChannelWebhookResult =>
  normalizeMetaMessagingWebhookEvent(payload, "messenger")

export const normalizeInstagramWebhookEvent = (payload: Record<string, unknown>): ChannelWebhookResult =>
  normalizeMetaMessagingWebhookEvent(payload, "instagram")

export const normalizeTelegramWebhookEvent = (
  payload: Record<string, unknown>,
  accountId?: string
): ChannelWebhookResult => {
  const inboundMessages: NormalizedWebhookMessage[] = []
  const message = (payload.message || payload.edited_message) as Record<string, unknown> | undefined

  if (message && typeof message === "object") {
    const from = (message.from || {}) as Record<string, unknown>
    const chat = (message.chat || {}) as Record<string, unknown>

    const externalUserId = String(from.id || chat.id || "")
    const externalThreadId = String(chat.id || "")
    const messageId = String(message.message_id || "")

    if (externalUserId && externalThreadId && messageId) {
      const username = typeof from.username === "string" ? from.username : null
      const firstName = typeof from.first_name === "string" ? from.first_name : null
      const lastName = typeof from.last_name === "string" ? from.last_name : null
      const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || null
      const externalMessageId = buildTelegramExternalMessageId(externalThreadId, messageId)

      inboundMessages.push({
        channel: "telegram",
        externalUserId,
        externalThreadId,
        externalMessageId,
        customerName: displayName,
        customerHandle: username,
        text: typeof message.text === "string" ? message.text : null,
        timestamp: normalizeProviderTimestamp(message.date as number | undefined, "s", true),
        rawPayload: message,
        accountId: accountId || null,
      })
    }
  }

  return {
    inboundMessages,
    statusEvents: [],
    rawPayload: payload,
  }
}
