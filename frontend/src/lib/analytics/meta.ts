"use client"

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    _metaPixelLoaded?: boolean
    __MARKETING_CONSENT__?: boolean
  }
}

type MetaEventName = "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase"

type MetaTrackResult = {
  eventId: string
}

const MARKETING_CONSENT_KEYS = [
  "marketing_consent",
  "cookie_consent_marketing",
  "consent_marketing",
]

const readCookie = (name: string) => {
  if (typeof document === "undefined") return ""

  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((entry) => entry.startsWith(`${name}=`))

  if (!match) {
    return ""
  }

  return decodeURIComponent(match.slice(name.length + 1))
}

export const getMarketingConsent = () => {
  if (typeof window === "undefined") {
    return false
  }

  if (window.__MARKETING_CONSENT__ === true) {
    return true
  }

  for (const key of MARKETING_CONSENT_KEYS) {
    const localStorageValue = window.localStorage.getItem(key)
    if (localStorageValue === "true") {
      return true
    }

    const cookieValue = readCookie(key)
    if (cookieValue === "true") {
      return true
    }
  }

  return false
}

export const getMetaBrowserIds = () => ({
  fbp: readCookie("_fbp") || undefined,
  fbc: readCookie("_fbc") || undefined,
})

const createEventId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `meta-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export const trackMetaEvent = (
  name: MetaEventName,
  eventData: Record<string, unknown>
): MetaTrackResult | null => {
  if (typeof window === "undefined") {
    return null
  }

  if (!getMarketingConsent()) {
    return null
  }

  if (!window.fbq || !window._metaPixelLoaded) {
    return null
  }

  const eventId = createEventId()

  window.fbq("track", name, eventData, { eventID: eventId })

  if (process.env.NODE_ENV !== "production") {
    console.debug("[meta/browser] fired", {
      event_name: name,
      event_id: eventId,
    })
  }

  return { eventId }
}
