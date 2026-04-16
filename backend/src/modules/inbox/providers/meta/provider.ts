import { normalizeInstagramWebhookEvent, normalizeMessengerWebhookEvent } from "../../adapters/meta-normalizers"
import { ChannelWebhookResult, SendMessageInput, SendMessageResult } from "../types"

type MetaConfig = {
  graphApiVersion: string
  pageAccessToken?: string
  instagramAccessToken?: string
}

type GraphError = {
  error?: {
    message?: string
  }
}

class MetaProvider {
  private graphApiVersion_: string
  private pageAccessToken_?: string
  private instagramAccessToken_?: string

  constructor(config?: Partial<MetaConfig>) {
    this.graphApiVersion_ = config?.graphApiVersion || process.env.META_GRAPH_API_VERSION || "v22.0"
    this.pageAccessToken_ = config?.pageAccessToken || process.env.META_PAGE_ACCESS_TOKEN
    this.instagramAccessToken_ = config?.instagramAccessToken || process.env.INSTAGRAM_ACCESS_TOKEN
  }

  parseMessengerWebhookPayload(payload: Record<string, unknown>): ChannelWebhookResult {
    return normalizeMessengerWebhookEvent(payload)
  }

  parseInstagramWebhookPayload(payload: Record<string, unknown>): ChannelWebhookResult {
    return normalizeInstagramWebhookEvent(payload)
  }

  async sendMessengerMessage(input: SendMessageInput): Promise<SendMessageResult> {
    if (!this.pageAccessToken_) {
      throw new Error("Missing META_PAGE_ACCESS_TOKEN for Messenger outbound messages.")
    }

    return this.sendMetaMessage({
      channel: "messenger",
      recipientId: input.to,
      accessToken: this.pageAccessToken_,
      text: input.text,
    })
  }

  async sendInstagramMessage(input: SendMessageInput): Promise<SendMessageResult> {
    const accessToken = this.instagramAccessToken_ || this.pageAccessToken_

    if (!accessToken) {
      throw new Error("Missing INSTAGRAM_ACCESS_TOKEN (or META_PAGE_ACCESS_TOKEN) for Instagram outbound messages.")
    }

    return this.sendMetaMessage({
      channel: "instagram",
      recipientId: input.to,
      accessToken,
      text: input.text,
    })
  }

  private async sendMetaMessage(input: {
    channel: "messenger" | "instagram"
    recipientId: string
    accessToken: string
    text: string
  }): Promise<SendMessageResult> {
    const endpoint = `https://graph.facebook.com/${this.graphApiVersion_}/me/messages`

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        recipient: {
          id: input.recipientId,
        },
        message: {
          text: input.text,
        },
      }),
    })

    const responseBody = (await response.json().catch(() => ({}))) as Record<string, unknown> & GraphError

    if (!response.ok) {
      const errorMessage = responseBody?.error?.message || `Meta API request failed with status ${response.status}`
      throw new Error(errorMessage)
    }

    const externalMessageId = String(responseBody.message_id || "")

    if (!externalMessageId) {
      throw new Error("Meta API did not return a message id.")
    }

    return {
      channel: input.channel,
      externalMessageId,
      rawResponse: responseBody,
    }
  }
}

export default MetaProvider
