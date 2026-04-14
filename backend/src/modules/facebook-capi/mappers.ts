import crypto from "node:crypto"
import { DomainEventType, FacebookEventPayload, BaseDomainEvent } from "./types"

const toUnixTime = (value?: string | Date) => {
  if (!value) {
    return Math.floor(Date.now() / 1000)
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return Math.floor(Date.now() / 1000)
  }

  return Math.floor(date.getTime() / 1000)
}

const normalizeCurrency = (currency?: string) =>
  currency ? currency.toUpperCase() : undefined

const hashIfPresent = (input?: string) => {
  if (!input) {
    return undefined
  }

  return crypto
    .createHash("sha256")
    .update(input.trim().toLowerCase())
    .digest("hex")
}

const resolveCustomerData = (event: BaseDomainEvent) => {
  const email = event.email || event.customer?.email
  const phone = event.phone || event.customer?.phone
  const externalId = event.external_id || event.customer_id || event.customer?.id

  return {
    em: hashIfPresent(email) ? [hashIfPresent(email)!] : undefined,
    ph: hashIfPresent(phone) ? [hashIfPresent(phone)!] : undefined,
    external_id: hashIfPresent(externalId) ? [hashIfPresent(externalId)!] : undefined,
    client_ip_address: event.context?.ip,
    client_user_agent: event.context?.user_agent,
    fbp: event.fbp || event._fbp,
    fbc: event.fbc || event._fbc,
  }
}

const asNumber = (value: unknown) => {
  const num = typeof value === "number" ? value : Number(value)
  return Number.isFinite(num) ? num : undefined
}

const resolveEventId = (
  type: DomainEventType,
  event: BaseDomainEvent,
  fallbackSeed: string
) => {
  if (event.event_id) {
    return event.event_id
  }

  const seed = `${type}:${event.id || fallbackSeed}:${event.updated_at || event.created_at || ""}`
  return crypto.createHash("sha256").update(seed).digest("hex")
}

export const mapToFacebookEvent = (
  type: DomainEventType,
  event: BaseDomainEvent & Record<string, unknown>
): FacebookEventPayload => {
  const eventName: Record<DomainEventType, FacebookEventPayload["event_name"]> = {
    purchase: "Purchase",
    add_to_cart: "AddToCart",
    initiate_checkout: "InitiateCheckout",
  }

  const items = (event.items as Array<Record<string, unknown>> | undefined) || []
  const contents = items.map((item) => ({
    id: String(item.variant_id || item.product_id || item.id || "unknown"),
    quantity: asNumber(item.quantity),
    item_price: asNumber(item.unit_price ?? item.item_price),
  }))

  const totalValue =
    asNumber(event.total) ??
    asNumber(event.subtotal) ??
    asNumber(event.raw_total) ??
    contents.reduce((sum, content) => {
      const line = (content.item_price || 0) * (content.quantity || 1)
      return sum + line
    }, 0)

  return {
    event_name: eventName[type],
    event_time: toUnixTime((event.updated_at as string | Date) || (event.created_at as string | Date)),
    action_source: "website",
    event_source_url: event.context?.event_source_url,
    event_id: resolveEventId(type, event, `${eventName[type]}-${Date.now()}`),
    user_data: resolveCustomerData(event),
    custom_data: {
      currency: normalizeCurrency((event.currency_code as string) || (event.currency as string)),
      value: totalValue,
      content_ids:
        contents.map((c) => c.id).filter(Boolean).length > 0
          ? contents.map((c) => c.id)
          : ((event.content_ids as string[] | undefined) || undefined),
      contents,
      num_items:
        asNumber(event.num_items) ||
        contents.reduce((sum, item) => sum + (item.quantity || 1), 0),
      content_type: (event.content_type as string) || "product",
      order_id: type === "purchase" ? String(event.id || "") : undefined,
    },
  }
}
