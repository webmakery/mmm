import { FacebookCapiClient } from "./client"
import { mapToFacebookEvent } from "./mappers"
import { BaseDomainEvent, DomainEventType, FacebookCapiModuleOptions } from "./types"
import { inspect } from "node:util"

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

const hasPopulatedHashedField = (value: unknown): value is string[] =>
  Array.isArray(value) &&
  value.some((item) => typeof item === "string" && item.trim().length > 0)

const formatSummaryMessage = (label: string, summary: Record<string, unknown>) =>
  `${label} ${inspect(summary, { depth: null, compact: true, breakLength: Infinity })}`

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
    const emIncluded = hasPopulatedHashedField(event.user_data.em)
    const phIncluded = hasPopulatedHashedField(event.user_data.ph)
    const externalIdIncluded = hasPopulatedHashedField(event.user_data.external_id)

    if (process.env.NODE_ENV !== "production") {
      const emailSummary = {
        module: "facebook-capi",
        event_name: event.event_name,
        event_id: event.event_id,
        email_exists: emailExists,
        email_hashed: emIncluded,
      }
      this.deps.logger?.info(
        formatSummaryMessage("Facebook CAPI email matching status", emailSummary),
        emailSummary
      )
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
        const outboundSummary = {
          event_name: event.event_name,
          user_data_keys: Object.keys(event.user_data),
          email_exists: emailExists,
          email_hashed: emIncluded,
          em_included: emIncluded,
          em_count: emIncluded ? event.user_data.em!.length : 0,
          ph_count: phIncluded ? event.user_data.ph!.length : 0,
          external_id_included: externalIdIncluded,
        }
        this.deps.logger?.info(
          formatSummaryMessage("Facebook CAPI outbound user_data summary", outboundSummary),
          outboundSummary
        )
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
