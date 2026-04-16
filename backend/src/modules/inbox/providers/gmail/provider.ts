import { SendMessageResult } from "../types"

type GmailTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
}

type GmailThreadListResponse = {
  threads?: Array<{ id: string }>
}

type GmailThreadResponse = {
  id: string
  messages?: GmailMessage[]
}

type GmailMessage = {
  id: string
  threadId: string
  snippet?: string
  internalDate?: string
  payload?: GmailMessagePayload
}

type GmailMessagePayload = {
  headers?: Array<{ name?: string; value?: string }>
  body?: {
    data?: string
  }
  parts?: GmailMessagePayload[]
}

export type GmailConnection = {
  emailAddress: string
  accessToken: string
  refreshToken: string
  expiryDate: string
  scope?: string
}

export type GmailNormalizedInboundMessage = {
  externalThreadId: string
  externalMessageId: string
  subject: string | null
  senderName: string | null
  senderEmail: string
  snippet: string | null
  body: string | null
  timestamp: Date
  headers: Record<string, string>
  rawPayload: Record<string, unknown>
}

class GmailProvider {
  private oauthClientId_: string
  private oauthClientSecret_: string
  private oauthRedirectUri_: string
  private oauthScopes_: string

  constructor() {
    this.oauthClientId_ = process.env.GMAIL_OAUTH_CLIENT_ID || ""
    this.oauthClientSecret_ = process.env.GMAIL_OAUTH_CLIENT_SECRET || ""
    this.oauthRedirectUri_ = process.env.GMAIL_OAUTH_REDIRECT_URI || ""
    this.oauthScopes_ =
      process.env.GMAIL_OAUTH_SCOPES ||
      "https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email"
  }

  assertOauthConfig() {
    if (!this.oauthClientId_ || !this.oauthClientSecret_ || !this.oauthRedirectUri_) {
      throw new Error("Missing Gmail OAuth configuration. Set GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, and GMAIL_OAUTH_REDIRECT_URI.")
    }
  }

  getAuthorizationUrl(state: string) {
    this.assertOauthConfig()

    const params = new URLSearchParams({
      client_id: this.oauthClientId_,
      redirect_uri: this.oauthRedirectUri_,
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      scope: this.oauthScopes_,
      include_granted_scopes: "true",
      state,
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  async exchangeCodeForTokens(code: string): Promise<GmailConnection> {
    this.assertOauthConfig()

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: this.oauthClientId_,
        client_secret: this.oauthClientSecret_,
        redirect_uri: this.oauthRedirectUri_,
        grant_type: "authorization_code",
      }),
    })

    const tokens = (await response.json()) as GmailTokenResponse

    if (!response.ok || !tokens.access_token) {
      throw new Error("Failed to exchange Gmail OAuth code for tokens.")
    }

    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    const profileBody = (await profileResponse.json().catch(() => ({}))) as { email?: string }

    if (!profileResponse.ok || !profileBody.email) {
      throw new Error("Failed to load Gmail account profile.")
    }

    return {
      emailAddress: profileBody.email.toLowerCase(),
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || "",
      expiryDate: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      scope: tokens.scope,
    }
  }

  async refreshAccessToken(connection: GmailConnection): Promise<GmailConnection> {
    if (!connection.refreshToken) {
      return connection
    }

    if (new Date(connection.expiryDate).getTime() > Date.now() + 60_000) {
      return connection
    }

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: this.oauthClientId_,
        client_secret: this.oauthClientSecret_,
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      }),
    })

    const tokens = (await response.json()) as GmailTokenResponse

    if (!response.ok || !tokens.access_token) {
      throw new Error("Failed to refresh Gmail access token.")
    }

    return {
      ...connection,
      accessToken: tokens.access_token,
      expiryDate: new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString(),
      scope: tokens.scope || connection.scope,
    }
  }

  async listThreads(connection: GmailConnection, maxResults = 20) {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/threads?maxResults=${maxResults}&q=-in:chats`,
      {
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
      }
    )

    const payload = (await response.json().catch(() => ({}))) as GmailThreadListResponse

    if (!response.ok) {
      throw new Error("Failed to list Gmail inbox threads.")
    }

    return payload.threads || []
  }

  async getThread(connection: GmailConnection, threadId: string) {
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`, {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
    })

    const payload = (await response.json().catch(() => ({}))) as GmailThreadResponse

    if (!response.ok) {
      throw new Error(`Failed to fetch Gmail thread ${threadId}.`)
    }

    return payload
  }

  normalizeThreadMessage(thread: GmailThreadResponse, message: GmailMessage): GmailNormalizedInboundMessage {
    const headers = this.readHeaders(message.payload)
    const fromHeader = headers.from || ""
    const senderEmail = this.extractEmail(fromHeader)

    return {
      externalThreadId: thread.id,
      externalMessageId: message.id,
      subject: headers.subject || null,
      senderName: this.extractSenderName(fromHeader),
      senderEmail,
      snippet: message.snippet || null,
      body: this.extractBody(message.payload),
      timestamp: message.internalDate ? new Date(Number(message.internalDate)) : new Date(),
      headers,
      rawPayload: message as unknown as Record<string, unknown>,
    }
  }

  async sendReply(input: {
    connection: GmailConnection
    to: string
    threadId: string
    subject?: string | null
    inReplyTo?: string | null
    references?: string | null
    text: string
  }): Promise<SendMessageResult> {
    const raw = this.buildRawEmail({
      to: input.to,
      subject: input.subject || "Re: Conversation",
      text: input.text,
      inReplyTo: input.inReplyTo,
      references: input.references,
    })

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.connection.accessToken}`,
      },
      body: JSON.stringify({
        raw,
        threadId: input.threadId,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as { id?: string }

    if (!response.ok || !payload.id) {
      throw new Error("Failed to send Gmail reply.")
    }

    return {
      channel: "email",
      externalMessageId: payload.id,
      rawResponse: payload as Record<string, unknown>,
    }
  }

  private readHeaders(payload?: GmailMessagePayload): Record<string, string> {
    const headers = payload?.headers || []

    return headers.reduce<Record<string, string>>((acc, header) => {
      const key = header.name?.toLowerCase()

      if (key && header.value) {
        acc[key] = header.value
      }

      return acc
    }, {})
  }

  private extractBody(payload?: GmailMessagePayload): string | null {
    if (!payload) {
      return null
    }

    if (payload.body?.data) {
      const parsed = this.decodeBase64Url(payload.body.data)

      if (parsed.trim()) {
        return parsed
      }
    }

    for (const part of payload.parts || []) {
      const nested = this.extractBody(part)

      if (nested) {
        return nested
      }
    }

    return null
  }

  private decodeBase64Url(value: string) {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/")
    return Buffer.from(normalized, "base64").toString("utf8")
  }

  private extractEmail(fromHeader: string) {
    const match = fromHeader.match(/<([^>]+)>/)
    const raw = (match?.[1] || fromHeader || "").trim()
    return raw.toLowerCase()
  }

  private extractSenderName(fromHeader: string): string | null {
    const [name] = fromHeader.split("<")
    const clean = name.trim().replace(/^"|"$/g, "")
    return clean || null
  }

  private buildRawEmail(input: {
    to: string
    subject: string
    text: string
    inReplyTo?: string | null
    references?: string | null
  }) {
    const headers = [`To: ${input.to}`, "Content-Type: text/plain; charset=\"UTF-8\"", "MIME-Version: 1.0", `Subject: ${input.subject}`]

    if (input.inReplyTo) {
      headers.push(`In-Reply-To: ${input.inReplyTo}`)
    }

    if (input.references) {
      headers.push(`References: ${input.references}`)
    }

    const email = `${headers.join("\r\n")}\r\n\r\n${input.text}`

    return Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")
  }
}

export default GmailProvider
