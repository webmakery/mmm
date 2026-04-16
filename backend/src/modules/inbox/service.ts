import { MedusaService } from "@medusajs/framework/utils"
import ChannelAccount from "./models/channel-account"
import Conversation from "./models/conversation"
import Participant from "./models/participant"
import Message from "./models/message"
import MessageAttachment from "./models/message-attachment"
import WhatsappProvider from "./providers/whatsapp/provider"
import { IngestWhatsappWebhookResult, SendConversationReplyInput } from "./types"

class InboxModuleService extends MedusaService({
  ChannelAccount,
  Conversation,
  Participant,
  Message,
  MessageAttachment,
}) {
  private static readonly statusPriority_: Record<string, number> = {
    pending: 0,
    sent: 1,
    delivered: 2,
    read: 3,
    failed: 4,
  }

  private whatsappProvider_: WhatsappProvider

  constructor(...args: any[]) {
    // @ts-expect-error generated class constructor signature
    super(...args)
    this.whatsappProvider_ = new WhatsappProvider()
  }

  private async getOrCreateChannelAccount(accountId: string) {
    const [existing] = await this.listChannelAccounts({
      external_account_id: accountId,
    })

    if (existing) {
      return existing
    }

    return this.createChannelAccounts({
      provider: "whatsapp",
      external_account_id: accountId,
    })
  }

  private async getOrCreateConversation(input: {
    accountRefId: string
    customerIdentifier: string
    customerDisplayName?: string | null
    providerThreadId?: string | null
  }) {
    const [existing] = await this.listConversations({
      channel_account_id: input.accountRefId,
      customer_identifier: input.customerIdentifier,
    })

    if (existing) {
      return existing
    }

    const conversation = await this.createConversations({
      provider: "whatsapp",
      channel_account_id: input.accountRefId,
      customer_identifier: input.customerIdentifier,
      external_thread_id: input.providerThreadId || null,
      status: "open",
      last_message_at: null,
    })

    await this.createParticipants({
      conversation_id: conversation.id,
      role: "customer",
      external_id: input.customerIdentifier,
      display_name: input.customerDisplayName || null,
    })

    return conversation
  }

  private async updateConversationTimestamp(conversationId: string, timestamp?: Date | null) {
    if (!timestamp) {
      return
    }

    await this.updateConversations({
      id: conversationId,
      last_message_at: timestamp,
    })
  }

  private getStatusPriority(status?: string | null): number {
    if (!status) {
      return -1
    }

    return InboxModuleService.statusPriority_[status] ?? -1
  }

  private getLatestStatusTimestamp(message: Record<string, any>): Date | null {
    const metadata = (message.metadata || {}) as Record<string, unknown>
    const rawTimestamp = metadata.last_status_event_at

    if (typeof rawTimestamp !== "string") {
      return null
    }

    const parsed = new Date(rawTimestamp)

    if (Number.isNaN(parsed.getTime())) {
      return null
    }

    return parsed
  }

  async ingestWhatsappWebhook(payload: Record<string, unknown>): Promise<IngestWhatsappWebhookResult> {
    const parsed = this.whatsappProvider_.parseWebhookPayload(payload)

    let inboundMessagesStored = 0
    let statusEventsStored = 0
    let duplicatesSkipped = 0

    for (const inboundMessage of parsed.inboundMessages) {
      const [duplicate] = await this.listMessages({
        external_message_id: inboundMessage.providerMessageId,
      })

      if (duplicate) {
        duplicatesSkipped += 1
        continue
      }

      const channelAccount = await this.getOrCreateChannelAccount(inboundMessage.accountId)
      const conversation = await this.getOrCreateConversation({
        accountRefId: channelAccount.id,
        customerIdentifier: inboundMessage.customerIdentifier,
        customerDisplayName: inboundMessage.customerDisplayName,
      })

      const [customerParticipant] = await this.listParticipants({
        conversation_id: conversation.id,
        external_id: inboundMessage.customerIdentifier,
      })

      await this.createMessages({
        provider: "whatsapp",
        external_message_id: inboundMessage.providerMessageId,
        direction: "inbound",
        status: "received",
        message_type: inboundMessage.messageType,
        content: inboundMessage.content || null,
        received_at: inboundMessage.timestamp || new Date(),
        raw_payload: inboundMessage.rawPayload,
        conversation_id: conversation.id,
        participant_id: customerParticipant?.id || null,
        channel_account_id: channelAccount.id,
      })

      await this.updateConversationTimestamp(conversation.id, inboundMessage.timestamp || new Date())
      inboundMessagesStored += 1
    }

    for (const statusEvent of parsed.statusEvents) {
      const [duplicate] = await this.listMessages({
        external_event_id: statusEvent.eventId,
      })

      if (duplicate) {
        duplicatesSkipped += 1
        continue
      }

      const [existingOutbound] = await this.listMessages({
        external_message_id: statusEvent.providerMessageId,
      })

      if (existingOutbound) {
        const currentStatus =
          typeof existingOutbound.status === "string" ? existingOutbound.status : existingOutbound.provider_status
        const currentStatusPriority = this.getStatusPriority(currentStatus)
        const incomingStatusPriority = this.getStatusPriority(statusEvent.status)
        const latestStatusTimestamp = this.getLatestStatusTimestamp(existingOutbound as Record<string, any>)
        const incomingStatusTimestamp = statusEvent.timestamp || null

        if (existingOutbound.external_event_id === statusEvent.eventId) {
          duplicatesSkipped += 1
          continue
        }

        if (
          latestStatusTimestamp &&
          incomingStatusTimestamp &&
          incomingStatusTimestamp.getTime() < latestStatusTimestamp.getTime()
        ) {
          duplicatesSkipped += 1
          continue
        }

        if (incomingStatusPriority < currentStatusPriority) {
          duplicatesSkipped += 1
          continue
        }

        if (
          incomingStatusPriority === currentStatusPriority &&
          latestStatusTimestamp &&
          incomingStatusTimestamp &&
          incomingStatusTimestamp.getTime() <= latestStatusTimestamp.getTime()
        ) {
          duplicatesSkipped += 1
          continue
        }

        const nextMetadata = {
          ...((existingOutbound.metadata || {}) as Record<string, unknown>),
          last_status_event_at: (incomingStatusTimestamp || latestStatusTimestamp || new Date()).toISOString(),
        }

        await this.updateMessages({
          id: existingOutbound.id,
          status: statusEvent.status,
          provider_status: statusEvent.status,
          error_message: statusEvent.errorMessage || null,
          raw_payload: statusEvent.rawPayload,
          external_event_id: statusEvent.eventId,
          metadata: nextMetadata,
        })

        await this.updateConversationTimestamp(existingOutbound.conversation_id, statusEvent.timestamp)
        statusEventsStored += 1
        continue
      }

      duplicatesSkipped += 1
    }

    return {
      inboundMessagesStored,
      statusEventsStored,
      duplicatesSkipped,
    }
  }

  async sendConversationReply(input: SendConversationReplyInput) {
    const conversation = await this.retrieveConversation(input.conversationId, {
      relations: ["channel_account"],
    })

    const [customerParticipant] = await this.listParticipants({
      conversation_id: input.conversationId,
      role: "customer",
    })

    if (!customerParticipant) {
      throw new Error("Conversation does not have a customer participant")
    }

    const providerResponse = await this.whatsappProvider_.sendReply({
      accountId: conversation.channel_account.external_account_id,
      to: customerParticipant.external_id,
      text: input.text,
    })

    const message = await this.createMessages({
      provider: "whatsapp",
      external_message_id: providerResponse.providerMessageId,
      direction: "outbound",
      message_type: "text",
      status: "sent",
      sent_at: new Date(),
      content: input.text,
      raw_payload: providerResponse.rawResponse,
      conversation_id: conversation.id,
      channel_account_id: conversation.channel_account_id,
      participant_id: customerParticipant.id,
    })

    await this.updateConversationTimestamp(conversation.id, new Date())

    return {
      message,
      provider_response: providerResponse.rawResponse,
    }
  }
}

export default InboxModuleService
