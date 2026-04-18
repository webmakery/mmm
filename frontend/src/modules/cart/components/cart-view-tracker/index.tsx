"use client"

import { trackJourneyEvent } from "@lib/analytics/customer-journey"
import { useEffect } from "react"

export default function CartViewTracker() {
  useEffect(() => {
    void trackJourneyEvent("cart_view", {}, { debounceMs: 3000 })
  }, [])

  return null
}
