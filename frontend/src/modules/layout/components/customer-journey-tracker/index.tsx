"use client"

import {
  getOrCreateAnonymousId,
  getOrCreateSessionId,
  scheduleEngagedVisit,
  trackJourneyEvent,
} from "@lib/analytics/customer-journey"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

export default function CustomerJourneyTracker() {
  const pathname = usePathname()

  useEffect(() => {
    getOrCreateAnonymousId()
    getOrCreateSessionId()
  }, [])

  useEffect(() => {
    if (!pathname) {
      return
    }

    void trackJourneyEvent("page_view")
    scheduleEngagedVisit(pathname)
  }, [pathname])

  return null
}
