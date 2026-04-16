export type InboxChannel = "whatsapp" | "messenger" | "instagram"

export type NormalizedWebhookMessage = {
  channel: InboxChannel
  externalThreadId?: string | null
  externalUserId: string
  externalMessageId: string
  customerName?: string | null
  customerHandle?: string | null
  customerPhone?: string | null
  text?: string | null
  timestamp?: Date | null
  rawPayload: Record<string, unknown>
  accountId?: string | null
  pageId?: string | null
  instagramAccountId?: string | null
}

export type NormalizedWebhookStatusEvent = {
  channel: InboxChannel
  externalMessageId: string
  eventId: string
  status: "sent" | "delivered" | "read" | "failed"
  timestamp?: Date | null
  errorMessage?: string | null
  rawPayload: Record<string, unknown>
}

export type ChannelWebhookResult = {
  inboundMessages: NormalizedWebhookMessage[]
  statusEvents: NormalizedWebhookStatusEvent[]
  rawPayload: Record<string, unknown>
}

export type SendMessageInput = {
  channel: InboxChannel
  accountId?: string
  pageId?: string
  instagramAccountId?: string
  to: string
  text: string
  contextMessageId?: string
}

export type SendMessageResult = {
  channel: InboxChannel
  externalMessageId: string
  rawResponse: Record<string, unknown>
}
