import { MedusaService } from "@medusajs/framework/utils"
import ChannelAccount from "./models/channel-account"
import Conversation from "./models/conversation"
import Participant from "./models/participant"
import Message from "./models/message"
import MessageAttachment from "./models/message-attachment"
import WhatsappProvider from "./providers/whatsapp/provider"
import MetaProvider from "./providers/meta/provider"
import TelegramProvider from "./providers/telegram/provider"
import { ChannelWebhookResult, InboxChannel } from "./providers/types"
import { CreatePrivateNoteInput, IngestWebhookResult, SendInboxMessageInput } from "./types"

class InboxModuleService extends MedusaService({
  ChannelAccount,
  Conversation,
  Participant,
  Message,
  MessageAttachment,
}) {
  private whatsappProvider_: WhatsappProvider
  private metaProvider_: MetaProvider
  private telegramProvider_: TelegramProvider

  constructor(...args: any[]) {
    super(...args)
    this.whatsappProvider_ = new WhatsappProvider()
    this.metaProvider_ = new MetaProvider()
    this.telegramProvider_ = new TelegramProvider()
  }

  private async getOrCreateChannelAccount(input: { channel: InboxChannel; externalAccountId: string }) {
    const [existing] = await this.listChannelAccounts({
      external_account_id: input.externalAccountId,
    })

    if (existing) {
      return existing
    }

    return this.createChannelAccounts({
      provider: input.channel,
      external_account_id: input.externalAccountId,
    })
  }

  private async getOrCreateConversation(input: {
    channel: InboxChannel
    accountRefId: string
    customerIdentifier: string
    customerPhone?: string | null
    customerDisplayName?: string | null
    customerHandle?: string | null
    externalThreadId?: string | null
    externalUserId?: string | null
    pageId?: string | null
    instagramAccountId?: string | null
    tenantId?: string | null
  }) {
    const [existing] = await this.listConversations({
      channel: input.channel,
      channel_account_id: input.accountRefId,
      customer_identifier: input.customerIdentifier,
      ...(input.tenantId ? { tenant_id: input.tenantId } : {}),
    })

    if (existing) {
      await this.updateConversations({
        id: existing.id,
        customer_name: input.customerDisplayName || existing.customer_name,
        customer_phone: input.customerPhone || existing.customer_phone,
        customer_handle: input.customerHandle || existing.customer_handle,
        external_thread_id: input.externalThreadId || existing.external_thread_id,
        external_user_id: input.externalUserId || existing.external_user_id,
        page_id: input.pageId || existing.page_id,
        instagram_account_id: input.instagramAccountId || existing.instagram_account_id,
      })

      return existing
    }

    const conversation = await this.createConversations({
      provider: input.channel,
      channel: input.channel,
      tenant_id: input.tenantId || null,
      channel_account_id: input.accountRefId,
      customer_identifier: input.customerIdentifier,
      customer_phone: input.customerPhone || input.customerIdentifier,
      customer_name: input.customerDisplayName || null,
      customer_handle: input.customerHandle || null,
      external_thread_id: input.externalThreadId || null,
      external_user_id: input.externalUserId || null,
      page_id: input.pageId || null,
      instagram_account_id: input.instagramAccountId || null,
      status: "open",
      unread_count: 0,
      last_message_at: null,
      last_message_preview: null,
    })

    await this.createParticipants({
      conversation_id: conversation.id,
      role: "customer",
      external_id: input.customerIdentifier,
      display_name: input.customerDisplayName || input.customerHandle || null,
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

  private async ingestWebhookPayload(payload: Record<string, unknown>, channelResult: ChannelWebhookResult): Promise<IngestWebhookResult> {
    let inboundMessagesStored = 0
    let statusEventsStored = 0
    let duplicatesSkipped = 0

    for (const inboundMessage of channelResult.inboundMessages) {
      const [duplicate] = await this.listMessages({
        external_message_id: inboundMessage.externalMessageId,
      })

      if (duplicate) {
        duplicatesSkipped += 1
        continue
      }

      const accountExternalId =
        inboundMessage.accountId ||
        inboundMessage.pageId ||
        inboundMessage.instagramAccountId ||
        inboundMessage.externalThreadId ||
        inboundMessage.externalUserId

      const channelAccount = await this.getOrCreateChannelAccount({
        channel: inboundMessage.channel,
        externalAccountId: accountExternalId,
      })

      const conversation = await this.getOrCreateConversation({
        channel: inboundMessage.channel,
        accountRefId: channelAccount.id,
        customerIdentifier: inboundMessage.externalUserId,
        customerPhone: inboundMessage.customerPhone,
        customerDisplayName: inboundMessage.customerName,
        customerHandle: inboundMessage.customerHandle,
        externalThreadId: inboundMessage.externalThreadId,
        externalUserId: inboundMessage.externalUserId,
        pageId: inboundMessage.pageId,
        instagramAccountId: inboundMessage.instagramAccountId,
      })

      const [customerParticipant] = await this.listParticipants({
        conversation_id: conversation.id,
        external_id: inboundMessage.externalUserId,
      })

      await this.createMessages({
        provider: inboundMessage.channel,
        channel: inboundMessage.channel,
        whatsapp_message_id: inboundMessage.channel === "whatsapp" ? inboundMessage.externalMessageId : null,
        external_message_id: inboundMessage.externalMessageId,
        direction: "inbound",
        status: "received",
        message_type: inboundMessage.text ? "text" : "unsupported",
        text: inboundMessage.text || null,
        content: inboundMessage.text || null,
        received_at: inboundMessage.timestamp || new Date(),
        raw_payload: inboundMessage.rawPayload,
        conversation_id: conversation.id,
        participant_id: customerParticipant?.id || null,
        channel_account_id: channelAccount.id,
      })

      await this.syncConversationState({
        conversationId: conversation.id,
        text: inboundMessage.text,
        timestamp: inboundMessage.timestamp || new Date(),
        incrementUnread: true,
      })
      inboundMessagesStored += 1
    }

    for (const statusEvent of channelResult.statusEvents) {
      const [duplicate] = await this.listMessages({
        external_event_id: statusEvent.eventId,
      })

      if (duplicate) {
        duplicatesSkipped += 1
        continue
      }

      const [existingOutbound] = await this.listMessages({
        external_message_id: statusEvent.externalMessageId,
      })

      if (!existingOutbound) {
        duplicatesSkipped += 1
        continue
      }

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
    }

    return {
      inboundMessagesStored,
      statusEventsStored,
      duplicatesSkipped,
      received: true,
      payload,
    }
  }

  async ingestWhatsappWebhook(payload: Record<string, unknown>): Promise<IngestWebhookResult> {
    const parsed = this.whatsappProvider_.parseWebhookPayload(payload)
    return this.ingestWebhookPayload(payload, parsed)
  }

  async ingestMessengerWebhook(payload: Record<string, unknown>): Promise<IngestWebhookResult> {
    const parsed = this.metaProvider_.parseMessengerWebhookPayload(payload)
    return this.ingestWebhookPayload(payload, parsed)
  }

  async ingestInstagramWebhook(payload: Record<string, unknown>): Promise<IngestWebhookResult> {
    const parsed = this.metaProvider_.parseInstagramWebhookPayload(payload)
    return this.ingestWebhookPayload(payload, parsed)
  }

  async ingestTelegramWebhook(payload: Record<string, unknown>): Promise<IngestWebhookResult> {
    const parsed = this.telegramProvider_.parseWebhookPayload(payload)
    return this.ingestWebhookPayload(payload, parsed)
  }

  async sendWhatsAppMessage(input: SendInboxMessageInput) {
    return this.sendInboxMessage({ ...input, channel: "whatsapp" })
  }

  async sendMessengerMessage(input: SendInboxMessageInput) {
    return this.sendInboxMessage({ ...input, channel: "messenger" })
  }

  async sendInstagramMessage(input: SendInboxMessageInput) {
    return this.sendInboxMessage({ ...input, channel: "instagram" })
  }

  async sendTelegramMessage(input: SendInboxMessageInput) {
    return this.sendInboxMessage({ ...input, channel: "telegram" })
  }

  async sendInboxMessage(input: SendInboxMessageInput) {
    const conversation = await this.retrieveConversation(input.conversationId, {
      relations: ["channel_account"],
    })

    const channel = input.channel || (conversation.channel as InboxChannel)

    if (channel !== conversation.channel) {
      throw new Error("Conversation channel mismatch")
    }

    const [customerParticipant] = await this.listParticipants({
      conversation_id: input.conversationId,
      role: "customer",
    })

    if (!customerParticipant) {
      throw new Error("Conversation does not have a customer participant")
    }

    const to = conversation.external_user_id || conversation.customer_phone || conversation.customer_identifier

    let providerResponse

    if (channel === "whatsapp") {
      providerResponse = await this.whatsappProvider_.sendMessage({
        channel,
        accountId: process.env.WHATSAPP_PHONE_NUMBER_ID || conversation.channel_account.external_account_id,
        to,
        text: input.text,
      })
    } else if (channel === "messenger") {
      providerResponse = await this.metaProvider_.sendMessengerMessage({
        channel,
        pageId: conversation.page_id || conversation.channel_account.external_account_id,
        to,
        text: input.text,
      })
    } else if (channel === "instagram") {
      providerResponse = await this.metaProvider_.sendInstagramMessage({
        channel,
        instagramAccountId: conversation.instagram_account_id || conversation.channel_account.external_account_id,
        to,
        text: input.text,
      })
    } else {
      providerResponse = await this.telegramProvider_.sendMessage({
        channel,
        to: conversation.external_thread_id || to,
        text: input.text,
      })
    }

    const message = await this.createMessages({
      provider: channel,
      channel,
      whatsapp_message_id: channel === "whatsapp" ? providerResponse.externalMessageId : null,
      external_message_id: providerResponse.externalMessageId,
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

  async sendConversationReply(input: { conversationId: string; text: string }) {
    return this.sendInboxMessage(input)
  }

  async createPrivateNote(input: CreatePrivateNoteInput) {
    const conversation = await this.retrieveConversation(input.conversationId)

    const actorExternalId = input.actorId || "admin"
    const [existingParticipant] = await this.listParticipants({
      conversation_id: input.conversationId,
      role: "agent",
      external_id: actorExternalId,
    })

    const participant =
      existingParticipant ||
      (await this.createParticipants({
        conversation_id: input.conversationId,
        role: "agent",
        external_id: actorExternalId,
        display_name: input.actorId ? "Admin" : "Internal",
      }))

    const message = await this.createMessages({
      provider: conversation.channel as InboxChannel,
      channel: conversation.channel as InboxChannel,
      direction: "system",
      message_type: "private_note",
      status: "received",
      text: input.text,
      content: input.text,
      sent_at: new Date(),
      conversation_id: input.conversationId,
      participant_id: participant.id,
      channel_account_id: conversation.channel_account_id,
    })

    await this.syncConversationState({
      conversationId: input.conversationId,
      text: input.text,
      timestamp: new Date(),
    })

    return { message }
  }

  async markConversationAsRead(conversationId: string) {
    await this.updateConversations({
      id: conversationId,
      unread_count: 0,
    })
  }
}

export default InboxModuleService
