import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { FACEBOOK_CAPI_MODULE } from "../modules/facebook-capi"
import FacebookCapiModuleService from "../modules/facebook-capi/service"

export default async function facebookCapiOrderPlacedHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const data = event.data
  const eventId =
    typeof data.event_id === "string" && data.event_id.length > 0
      ? data.event_id
      : null

  if (!eventId) {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[meta/server] skipping order subscriber event without frontend event_id", {
        event_name: event.name,
      })
    }
    return
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[meta/server] purchase tracking function invoked", {
      event_name: "Purchase",
      event_id: eventId,
      source: "order-subscriber",
    })
  }

  const facebookCapiService: FacebookCapiModuleService = container.resolve(FACEBOOK_CAPI_MODULE)
  const responseBody = await facebookCapiService.track("purchase", data)

  if (process.env.NODE_ENV !== "production") {
    console.debug("[meta/server] meta response body", {
      event_name: "Purchase",
      event_id: eventId,
      response: responseBody,
    })
  }
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.completed"],
}
