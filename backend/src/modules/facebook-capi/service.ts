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

    const event = mapToFacebookEvent(type, payload)

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
        original_medusa_total: originalTotal,
        converted_meta_value: event.custom_data?.value,
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
