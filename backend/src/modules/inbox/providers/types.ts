export type NormalizedInboundMessage = {
  provider: "whatsapp"
  providerMessageId: string
  accountId: string
  customerIdentifier: string
  customerDisplayName?: string | null
  timestamp?: Date | null
  content?: string | null
  messageType: "text" | "unsupported"
  rawPayload: Record<string, unknown>
}

export type NormalizedStatusEvent = {
  provider: "whatsapp"
  eventId: string
  providerMessageId: string
  accountId: string
  status: "sent" | "delivered" | "read" | "failed"
  timestamp?: Date | null
  errorMessage?: string | null
  rawPayload: Record<string, unknown>
}

export type ProviderWebhookResult = {
  inboundMessages: NormalizedInboundMessage[]
  statusEvents: NormalizedStatusEvent[]
  rawPayload: Record<string, unknown>
}

export type SendReplyInput = {
  accountId: string
  to: string
  text: string
  contextMessageId?: string
}

export type SendReplyResult = {
  provider: "whatsapp"
  providerMessageId: string
  rawResponse: Record<string, unknown>
}

export interface InboxProviderAdapter {
  provider: "whatsapp"
  parseWebhookPayload(payload: Record<string, unknown>): ProviderWebhookResult
  sendReply(input: SendReplyInput): Promise<SendReplyResult>
}
