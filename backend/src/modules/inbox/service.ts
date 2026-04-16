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
  private whatsappProvider_: WhatsappProvider

  constructor(...args: any[]) {
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
    tenantId?: string | null
  }) {
    const [existing] = await this.listConversations({
      channel_account_id: input.accountRefId,
      customer_phone: input.customerIdentifier,
      ...(input.tenantId ? { tenant_id: input.tenantId } : {}),
    })

    if (existing) {
      if (input.customerDisplayName && existing.customer_name !== input.customerDisplayName) {
        await this.updateConversations({
          id: existing.id,
          customer_name: input.customerDisplayName,
        })
      }

      return existing
    }

    const conversation = await this.createConversations({
      provider: "whatsapp",
      channel: "whatsapp",
      tenant_id: input.tenantId || null,
      channel_account_id: input.accountRefId,
      customer_identifier: input.customerIdentifier,
      customer_phone: input.customerIdentifier,
      customer_name: input.customerDisplayName || null,
      external_thread_id: input.providerThreadId || null,
      status: "open",
      unread_count: 0,
      last_message_at: null,
      last_message_preview: null,
    })

    await this.createParticipants({
      conversation_id: conversation.id,
      role: "customer",
      external_id: input.customerIdentifier,
      display_name: input.customerDisplayName || null,
    })

    return conversation
  }

  private async syncConversationState(input: {
    conversationId: string
    text?: string | null
    timestamp?: Date | null
    incrementUnread?: boolean
    resetUnread?: boolean
  }) {
    const updates: Record<string, unknown> = {
      id: input.conversationId,
    }

    if (typeof input.text === "string") {
      updates.last_message_preview = input.text.slice(0, 280)
    }

    if (input.timestamp) {
      updates.last_message_at = input.timestamp
    }

    if (input.incrementUnread || input.resetUnread) {
      const conversation = await this.retrieveConversation(input.conversationId)
      updates.unread_count = input.resetUnread ? 0 : (conversation.unread_count || 0) + 1
    }

    await this.updateConversations(updates)
  }

  async ingestWhatsappWebhook(payload: Record<string, unknown>): Promise<IngestWhatsappWebhookResult> {
    const parsed = this.whatsappProvider_.parseWebhookPayload(payload)

    let inboundMessagesStored = 0
    let statusEventsStored = 0
    let duplicatesSkipped = 0

    for (const inboundMessage of parsed.inboundMessages) {
      const [duplicate] = await this.listMessages({
        whatsapp_message_id: inboundMessage.providerMessageId,
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
        whatsapp_message_id: inboundMessage.providerMessageId,
        external_message_id: inboundMessage.providerMessageId,
        direction: "inbound",
        status: "received",
        message_type: inboundMessage.messageType,
        text: inboundMessage.content || null,
        content: inboundMessage.content || null,
        received_at: inboundMessage.timestamp || new Date(),
        raw_payload: inboundMessage.rawPayload,
        conversation_id: conversation.id,
        participant_id: customerParticipant?.id || null,
        channel_account_id: channelAccount.id,
      })

      await this.syncConversationState({
        conversationId: conversation.id,
        text: inboundMessage.content,
        timestamp: inboundMessage.timestamp || new Date(),
        incrementUnread: true,
      })
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
        whatsapp_message_id: statusEvent.providerMessageId,
      })

      if (existingOutbound) {
        await this.updateMessages({
          id: existingOutbound.id,
          status: statusEvent.status,
          provider_status: statusEvent.status,
          error_message: statusEvent.errorMessage || null,
          raw_payload: statusEvent.rawPayload,
          external_event_id: statusEvent.eventId,
        })

        if (statusEvent.timestamp) {
          await this.syncConversationState({
            conversationId: existingOutbound.conversation_id,
            timestamp: statusEvent.timestamp,
          })
        }

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
      accountId: process.env.WHATSAPP_PHONE_NUMBER_ID || conversation.channel_account.external_account_id,
      to: conversation.customer_phone,
      text: input.text,
    })

    const message = await this.createMessages({
      provider: "whatsapp",
      whatsapp_message_id: providerResponse.providerMessageId,
      external_message_id: providerResponse.providerMessageId,
      direction: "outbound",
      message_type: "text",
      status: "sent",
      sent_at: new Date(),
      text: input.text,
      content: input.text,
      raw_payload: providerResponse.rawResponse,
      conversation_id: conversation.id,
      channel_account_id: conversation.channel_account_id,
      participant_id: customerParticipant.id,
    })

    await this.syncConversationState({
      conversationId: conversation.id,
      text: input.text,
      timestamp: new Date(),
    })

    return {
      message,
      provider_response: providerResponse.rawResponse,
    }
  }

  async markConversationAsRead(conversationId: string) {
    await this.updateConversations({
      id: conversationId,
      unread_count: 0,
    })
  }
}

export default InboxModuleService
