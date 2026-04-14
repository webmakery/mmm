"use client"

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
}

export default function MetaPixelProvider() {
  const [isConsentGranted, setIsConsentGranted] = useState(false)

  const canLoadPixel = useMemo(() => Boolean(META_PIXEL_ID && isConsentGranted), [isConsentGranted])

  useEffect(() => {
    setIsConsentGranted(getMarketingConsent())
  }, [])

  useEffect(() => {
    if (!canLoadPixel || !META_PIXEL_ID) {
      return
    }

    loadMetaPixel(META_PIXEL_ID)
  }, [canLoadPixel])

  return null
}
