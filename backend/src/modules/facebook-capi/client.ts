import {
  DEFAULT_API_VERSION,
  DEFAULT_MAX_RETRIES,
  DEFAULT_TIMEOUT_MS,
  RETRYABLE_STATUS,
} from "./constants"
import { FacebookCapiModuleOptions, FacebookEventPayload } from "./types"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export class FacebookCapiClient {
  private pixelId: string
  private accessToken: string
  private apiVersion: string
  private testEventCode?: string
  private timeoutMs: number
  private maxRetries: number

  constructor(private options: FacebookCapiModuleOptions) {
    this.pixelId = options.pixelId || ""
    this.accessToken = options.accessToken || ""
    this.apiVersion = options.apiVersion || DEFAULT_API_VERSION
    this.testEventCode = options.testEventCode
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
    this.maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  }

  isEnabled() {
    return Boolean(
      (this.options.enabled ?? true) && this.pixelId && this.accessToken
    )
  }

  async sendEvent(event: FacebookEventPayload): Promise<void> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.pixelId}/events?access_token=${this.accessToken}`

    const body: Record<string, unknown> = {
      data: [event],
    }

    if (this.testEventCode) {
      body.test_event_code = this.testEventCode
    }

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), this.timeoutMs)

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        })

        if (response.ok) {
          return
        }

        if (!RETRYABLE_STATUS.has(response.status) || attempt === this.maxRetries) {
          const responseBody = await response.text()
          throw new Error(
            `Facebook CAPI request failed (${response.status}): ${responseBody}`
          )
        }
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error
        }
      } finally {
        clearTimeout(timeout)
      }

      await sleep(100 * (attempt + 1) ** 2)
    }
  }
}
