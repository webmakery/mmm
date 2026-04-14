import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { FACEBOOK_CAPI_MODULE } from "../modules/facebook-capi"
import FacebookCapiModuleService from "../modules/facebook-capi/service"

const findEmailInOrderData = (payload: Record<string, unknown>) => {
  const order = payload.order as Record<string, unknown> | undefined
  const customer = payload.customer as Record<string, unknown> | undefined
  const billingAddress = payload.billing_address as Record<string, unknown> | undefined
  const shippingAddress = payload.shipping_address as Record<string, unknown> | undefined
  const orderCustomer = order?.customer as Record<string, unknown> | undefined
  const orderBillingAddress = order?.billing_address as Record<string, unknown> | undefined
  const orderShippingAddress = order?.shipping_address as Record<string, unknown> | undefined

  const candidates = [
    payload.email,
    customer?.email,
    order?.email,
    orderCustomer?.email,
    billingAddress?.email,
    shippingAddress?.email,
    orderBillingAddress?.email,
    orderShippingAddress?.email,
  ]

  return candidates.find(
    (candidate): candidate is string => typeof candidate === "string" && candidate.trim().length > 0
  )
}

export default async function facebookCapiOrderPlacedHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const data = { ...event.data }
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

    console.debug("[meta/purchase] raw medusa totals from subscriber", {
      event_id: eventId,
      total: data.total,
      subtotal: data.subtotal,
      raw_total: data.raw_total,
    })
  }

  if (!findEmailInOrderData(data) && typeof data.id === "string" && data.id.length > 0) {
    const query = container.resolve("query") as {
      graph: (input: {
        entity: string
        fields: string[]
        filters: Record<string, unknown>
      }) => Promise<{ data?: Array<Record<string, unknown>> }>
    }

    try {
      const { data: orderResults } = await query.graph({
        entity: "order",
        fields: [
          "id",
          "email",
          "customer.email",
          "billing_address.email",
          "shipping_address.email",
        ],
        filters: { id: data.id },
      })

      const orderRecord = orderResults?.[0]
      if (orderRecord) {
        data.order = orderRecord
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[meta/server] failed to enrich purchase payload from order query", {
          event_id: eventId,
          order_id: data.id,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }
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
