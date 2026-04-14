"use client"

import { createMetaEventId, getMarketingConsent } from "@lib/analytics/meta"
import { useEffect, useMemo, useState } from "react"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
    _metaPixelLoaded?: boolean
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

const loadMetaPixel = (pixelId: string) => {
  if (typeof window === "undefined") {
    return
  }

  if (window._metaPixelLoaded || window.fbq) {
    return
  }

  !(function (f: Window, b: Document, e: string, v: string, n?: any, t?: HTMLScriptElement, s?: HTMLScriptElement) {
    if (f.fbq) return
    n = function () {
      n.callMethod
        ? n.callMethod.apply(n, arguments)
        : n.queue.push(arguments)
    }

    if (!f._fbq) f._fbq = n
    n.push = n
    n.loaded = true
    n.version = "2.0"
    n.queue = []
    t = b.createElement(e) as HTMLScriptElement
    t.async = true
    t.src = v
    s = b.getElementsByTagName(e)[0] as HTMLScriptElement
    s.parentNode?.insertBefore(t, s)
    f.fbq = n
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js")

  window.fbq?.("init", pixelId)
  window.fbq?.("track", "PageView")
  window._metaPixelLoaded = true

  if (process.env.NODE_ENV !== "production") {
    console.debug("Meta Pixel initialized")
    console.debug("[meta/browser] pixel initialized", {
      pixel_id: pixelId,
    })
    console.debug("[meta/browser] fired", {
      event_name: "PageView",
      event_id: null,
    })
  }
}

export default function MetaPixelProvider() {
  const [isConsentGranted, setIsConsentGranted] = useState(false)

  const canLoadPixel = useMemo(() => Boolean(META_PIXEL_ID && isConsentGranted), [isConsentGranted])

  useEffect(() => {
    setIsConsentGranted(getMarketingConsent())

    const interval = window.setInterval(() => {
      setIsConsentGranted(getMarketingConsent())
    }, 1000)

    const onStorageChange = () => setIsConsentGranted(getMarketingConsent())
    window.addEventListener("storage", onStorageChange)

    return () => {
      window.clearInterval(interval)
      window.removeEventListener("storage", onStorageChange)
    }
  }, [])

  useEffect(() => {
    if (!canLoadPixel || !META_PIXEL_ID) {
      if (process.env.NODE_ENV !== "production" && !META_PIXEL_ID) {
        console.warn("[meta/browser] NEXT_PUBLIC_META_PIXEL_ID is missing")
      }

      return
    }

    loadMetaPixel(META_PIXEL_ID)
  }, [canLoadPixel])

  const fireDevPurchaseEvent = () => {
    if (typeof window === "undefined" || !window.fbq || !window._metaPixelLoaded) {
      return
    }

    const eventID = createMetaEventId()
    window.fbq("track", "Purchase", { currency: "USD", value: 1.0 }, { eventID })

    if (process.env.NODE_ENV !== "production") {
      console.debug("[meta/browser] fired", {
        event_name: "Purchase",
        event_id: eventID,
      })
    }
  }

  return process.env.NODE_ENV !== "production" ? (
    <button
      type="button"
      onClick={fireDevPurchaseEvent}
      className="fixed bottom-3 right-3 z-[9999] rounded bg-black px-3 py-2 text-xs text-white opacity-80 hover:opacity-100"
      data-testid="meta-dev-purchase-button"
    >
      Dev: Fire Meta Purchase
    </button>
  ) : null
}
