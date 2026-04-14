import { FacebookCapiClient } from "./client"
import { mapToFacebookEvent } from "./mappers"
import { BaseDomainEvent, DomainEventType, FacebookCapiModuleOptions } from "./types"

type ServiceDeps = {
  logger?: {
    info: (message: string, meta?: Record<string, unknown>) => void
    warn: (message: string, meta?: Record<string, unknown>) => void
    error: (message: string, meta?: Record<string, unknown>) => void
  }
}

const hasEmailSource = (payload: BaseDomainEvent & Record<string, unknown>) =>
  Boolean(
    payload.email ||
      payload.customer?.email ||
      (payload.cart as Record<string, unknown> | undefined)?.email ||
      ((payload.cart as Record<string, unknown> | undefined)?.customer as
        | Record<string, unknown>
        | undefined)?.email ||
      (payload.order as Record<string, unknown> | undefined)?.email ||
      ((payload.order as Record<string, unknown> | undefined)?.customer as
        | Record<string, unknown>
        | undefined)?.email ||
      (payload.checkout as Record<string, unknown> | undefined)?.email ||
      ((payload.checkout as Record<string, unknown> | undefined)?.customer as
        | Record<string, unknown>
        | undefined)?.email ||
      (payload.payload as Record<string, unknown> | undefined)?.email ||
      (
        (payload.payload as Record<string, unknown> | undefined)?.checkout as
          | Record<string, unknown>
          | undefined
      )?.email
  )

class FacebookCapiModuleService {
  private client: FacebookCapiClient
  private readonly sentEventIds = new Set<string>()

  constructor(private deps: ServiceDeps, private options: FacebookCapiModuleOptions = {}) {
    this.client = new FacebookCapiClient(options)
  }

  async track(type: DomainEventType, payload: BaseDomainEvent & Record<string, unknown>) {
    if (!this.client.isEnabled()) {
      this.deps.logger?.warn("Facebook CAPI is disabled or missing credentials", {
        module: "facebook-capi",
      })
      return null
    }

    const emailExists = hasEmailSource(payload)
    const event = mapToFacebookEvent(type, payload)

    if (process.env.NODE_ENV !== "production") {
      this.deps.logger?.info("Facebook CAPI email matching status", {
        module: "facebook-capi",
        event_name: event.event_name,
        event_id: event.event_id,
        email_exists: emailExists,
        email_hashed: Boolean(event.user_data.em?.length),
      })
    }

    if (
      type === "purchase" &&
      (process.env.NODE_ENV !== "production" ||
        process.env.META_DEBUG === "true")
    ) {
      const originalTotal =
        typeof payload.total === "number"
          ? payload.total
          : typeof payload.subtotal === "number"
            ? payload.subtotal
            : payload.raw_total

      this.deps.logger?.info("Facebook CAPI purchase value conversion", {
        module: "facebook-capi",
        raw_medusa_total: originalTotal,
        forwarded_value: payload.value,
        backend_final_meta_value: event.custom_data?.value,
        event_id: event.event_id,
      })
    }

    if (this.sentEventIds.has(event.event_id)) {
      this.deps.logger?.info("Skipping duplicate Facebook CAPI event", {
        module: "facebook-capi",
        event_id: event.event_id,
        type,
      })
      return null
    }

    try {
      if (process.env.NODE_ENV !== "production") {
        this.deps.logger?.info("Facebook CAPI outbound user_data summary", {
          event_name: event.event_name,
          user_data_keys: Object.keys(event.user_data),
          email_exists: emailExists,
          email_hashed: Boolean(event.user_data.em?.length),
          em_included: Object.prototype.hasOwnProperty.call(event.user_data, "em"),
        })
      }

      const responsePayload = await this.client.sendEvent(event)
      this.sentEventIds.add(event.event_id)

      this.deps.logger?.info("Sent Facebook CAPI event", {
        module: "facebook-capi",
        event_name: event.event_name,
        event_id: event.event_id,
      })

      if (process.env.NODE_ENV !== "production") {
        this.deps.logger?.info("Facebook CAPI response", {
          module: "facebook-capi",
          event_name: event.event_name,
          event_id: event.event_id,
          response: responsePayload,
        })
      }

      return responsePayload
    } catch (error) {
      this.deps.logger?.error("Failed to send Facebook CAPI event", {
        module: "facebook-capi",
        event_name: event.event_name,
        event_id: event.event_id,
        error: error instanceof Error ? error.message : "Unknown error",
      })

      throw error
    }
  }
}

export default FacebookCapiModuleService
