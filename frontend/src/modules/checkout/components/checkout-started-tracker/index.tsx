"use client"

import { trackJourneyEvent } from "@lib/analytics/customer-journey"
import { useEffect } from "react"

export default function CheckoutStartedTracker() {
  useEffect(() => {
    void trackJourneyEvent("checkout_started", {}, { debounceMs: 3000 })
  }, [])

  return null
}
