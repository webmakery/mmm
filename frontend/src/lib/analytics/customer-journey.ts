"use client"

const ANON_KEY = "journey_anonymous_id"
const SESSION_KEY = "journey_session_id"
const SESSION_STARTED_KEY = "journey_session_started_at"
const ENGAGED_PREFIX = "journey_engaged_5s"
const DEBOUNCE_PREFIX = "journey_debounce"

export type JourneyEventName =
  | "page_view"
  | "engaged_visit_5s"
  | "signup_started"
  | "signup_completed"
  | "add_to_cart"
  | "cart_view"
  | "checkout_started"

const getBackendBase = () =>
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || ""

const buildUrl = (path: string) => `${getBackendBase()}${path}`

const randomId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

const readUtmFromSearch = () => {
  if (typeof window === "undefined") {
    return {}
  }

  const params = new URLSearchParams(window.location.search)

  return {
    utm_source: params.get("utm_source") || undefined,
    utm_medium: params.get("utm_medium") || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  }
}

export const getOrCreateAnonymousId = () => {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.localStorage.getItem(ANON_KEY)

  if (existing) {
    return existing
  }

  const generated = randomId("anon")
  window.localStorage.setItem(ANON_KEY, generated)
  return generated
}

export const getOrCreateSessionId = () => {
  if (typeof window === "undefined") {
    return ""
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY)

  if (existing) {
    return existing
  }

  const generated = randomId("sess")
  window.sessionStorage.setItem(SESSION_KEY, generated)
  window.sessionStorage.setItem(SESSION_STARTED_KEY, new Date().toISOString())
  return generated
}

const shouldDebounce = (eventName: string, debounceMs = 2000) => {
  if (typeof window === "undefined") {
    return false
  }

  const key = `${DEBOUNCE_PREFIX}:${eventName}`
  const last = Number(window.sessionStorage.getItem(key) || 0)
  const now = Date.now()

  if (now - last < debounceMs) {
    return true
  }

  window.sessionStorage.setItem(key, String(now))
  return false
}

export const trackJourneyEvent = async (
  event_name: JourneyEventName,
  payload: Record<string, unknown> = {},
  options?: { debounceMs?: number }
) => {
  if (typeof window === "undefined") {
    return
  }

  if (options?.debounceMs && shouldDebounce(event_name, options.debounceMs)) {
    return
  }

  const anonymous_id = getOrCreateAnonymousId()
  const session_id = getOrCreateSessionId()
  const utm = readUtmFromSearch()

  const requestBody = {
    anonymous_id,
    session_id,
    event_name,
    event_source: "storefront",
    page_url: window.location.href,
    landing_page: window.location.pathname,
    referrer: document.referrer || undefined,
    ...utm,
    payload,
  }

  await fetch(buildUrl("/store/journey/events"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(requestBody),
    keepalive: true,
  }).catch(() => {
    // tracking should never block UX paths
  })
}

export const trackIdentifyUser = async (customerId: string) => {
  if (typeof window === "undefined") {
    return
  }

  await fetch(buildUrl("/store/journey/identify"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      anonymous_id: getOrCreateAnonymousId(),
      session_id: getOrCreateSessionId(),
      customer_id: customerId,
      source: "storefront",
    }),
    keepalive: true,
  }).catch(() => {
    // tracking should never block UX paths
  })
}

export const scheduleEngagedVisit = (pageKey: string) => {
  if (typeof window === "undefined") {
    return
  }

  const sessionId = getOrCreateSessionId()
  const uniqueKey = `${ENGAGED_PREFIX}:${sessionId}:${pageKey}`

  if (window.sessionStorage.getItem(uniqueKey)) {
    return
  }

  window.setTimeout(() => {
    if (window.sessionStorage.getItem(uniqueKey)) {
      return
    }

    window.sessionStorage.setItem(uniqueKey, "1")
    void trackJourneyEvent("engaged_visit_5s")
  }, 5000)
}
