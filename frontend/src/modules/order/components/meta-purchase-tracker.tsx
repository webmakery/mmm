"use client"

import { createMetaEventId, getMetaBrowserIds, trackMetaEvent } from "@lib/analytics/meta"
import { resolveMetaValue } from "@lib/analytics/meta-value"
import { trackMetaEventToBackend } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import { useEffect, useRef } from "react"

type MetaPurchaseTrackerProps = {
  order: HttpTypes.StoreOrder
}

export default function MetaPurchaseTracker({ order }: MetaPurchaseTrackerProps) {
  const hasTracked = useRef(false)

  useEffect(() => {
    if (hasTracked.current) {
      return
    }

    const currency = order.currency_code?.toUpperCase()
    const medusaTotal = typeof order.total === "number" ? order.total : undefined
    const value = resolveMetaValue({ medusaMinorUnitValue: medusaTotal })
    const contents =
      order.items?.map((item) => ({
        id: String(item.variant_id || item.product_id || item.id || "unknown"),
        quantity: item.quantity,
        item_price: resolveMetaValue({ medusaMinorUnitValue: item.unit_price }),
      })) ?? []

    const eventPayload = {
      currency,
      value,
      content_type: "product",
      content_ids: contents.map((item) => item.id),
      contents,
      num_items: contents.reduce((sum, item) => sum + (item.quantity || 1), 0),
    }

    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PUBLIC_META_DEBUG === "true"
    ) {
      console.debug("[meta/purchase] currency conversion", {
        raw_medusa_total: order.total,
        frontend_computed_meta_value: value,
        source: "order.completed",
      })
    }

    const eventId = createMetaEventId()
    const browserEvent = trackMetaEvent("Purchase", eventPayload, eventId)
    const browserIds = getMetaBrowserIds()

    if (!browserEvent) {
      return
    }

    hasTracked.current = true

    trackMetaEventToBackend({
      event_name: "Purchase",
      event_id: browserEvent.eventId,
      event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
      _fbp: browserIds.fbp,
      _fbc: browserIds.fbc,
      fbp: browserIds.fbp,
      fbc: browserIds.fbc,
      currency,
      total: medusaTotal,
      raw_total: medusaTotal,
      value,
      content_type: "product",
      content_ids: eventPayload.content_ids,
      contents,
      num_items: eventPayload.num_items,
    }).catch((error) => {
      if (process.env.NODE_ENV !== "production") {
        console.error("[meta/purchase] failed to forward purchase event", error)
      }
    })
  }, [order])

  return null
}
