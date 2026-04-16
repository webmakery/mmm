import { InboxChannel } from "./providers/types"

export type IngestWebhookResult = {
  inboundMessagesStored: number
  statusEventsStored: number
  duplicatesSkipped: number
  received: boolean
  payload: Record<string, unknown>
}

export type SendInboxMessageInput = {
  channel?: InboxChannel
  conversationId: string
  text: string
}
