export type IngestWhatsappWebhookResult = {
  inboundMessagesStored: number
  statusEventsStored: number
  duplicatesSkipped: number
}

export type SendConversationReplyInput = {
  conversationId: string
  text: string
}
