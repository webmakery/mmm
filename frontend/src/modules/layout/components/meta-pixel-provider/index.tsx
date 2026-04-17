"use client"

import { COOKIE_CONSENT_EVENT } from "@lib/analytics/consent"
import { getMarketingConsent } from "@lib/analytics/meta"
import { useEffect, useMemo, useState } from "react"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _fbq?: (...args: unknown[]) => void
    _metaPixelLoaded?: boolean
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const META_PAGE_VIEW_KEY = "__meta_pageview_fired__"

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

  window.fbq?.("set", "autoConfig", false, pixelId)
  window.fbq?.("init", pixelId)

  if (!window.sessionStorage.getItem(META_PAGE_VIEW_KEY)) {
    window.fbq?.("track", "PageView")
    window.sessionStorage.setItem(META_PAGE_VIEW_KEY, "true")
  }

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
    const syncConsent = () => {
      setIsConsentGranted(getMarketingConsent())
    }

    syncConsent()

    window.addEventListener(COOKIE_CONSENT_EVENT, syncConsent)
    window.addEventListener("storage", syncConsent)

    return () => {
      window.removeEventListener(COOKIE_CONSENT_EVENT, syncConsent)
      window.removeEventListener("storage", syncConsent)
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

  return null
}
