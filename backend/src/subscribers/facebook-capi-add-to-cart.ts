import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"

const hasFrontendEventId = (data: Record<string, unknown>) => {
  const eventId = data.event_id
  return typeof eventId === "string" && eventId.length > 0
}

export default async function facebookCapiAddToCartHandler({
  event,
}: SubscriberArgs<Record<string, unknown>>) {
  if (process.env.NODE_ENV !== "production" && !hasFrontendEventId(event.data)) {
    // The storefront sends AddToCart via /store/meta/track with a shared browser/server event_id.
    // This subscriber intentionally ignores native cart events without that id to avoid duplicate sends.
    console.debug("[meta/server] skipping cart event without frontend event_id", {
      event_name: event.name,
    })
  }
}

export const config: SubscriberConfig = {
  event: ["cart.line_item_added", "cart.updated"],
}
