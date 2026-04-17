"use client"

declare global {
  interface Window {
    __MARKETING_CONSENT__?: boolean
  }
}

export type CookieConsentPreferences = {
  essential: true
  analytics: boolean
  marketing: boolean
}

export type CookieConsentRecord = {
  version: number
  timestamp: string
  source: "accept_all" | "reject_all" | "customize"
  preferences: CookieConsentPreferences
}

export const COOKIE_CONSENT_STORAGE_KEY = "cookie_consent_preferences"
export const COOKIE_CONSENT_EVENT = "cookie-consent-updated"
export const COOKIE_CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const DEFAULT_COOKIE_CONSENT: CookieConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
}

const parseJson = (value: string | null): CookieConsentRecord | null => {
  if (!value) {
    return null
  }

  try {
    const parsed = JSON.parse(value) as CookieConsentRecord

    if (
      !parsed ||
      typeof parsed !== "object" ||
      !parsed.preferences ||
      parsed.preferences.essential !== true
    ) {
      return null
    }

    return {
      ...parsed,
      preferences: {
        essential: true,
        analytics: Boolean(parsed.preferences.analytics),
        marketing: Boolean(parsed.preferences.marketing),
      },
    }
  } catch {
    return null
  }
}

export const readCookie = (name: string) => {
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

const writeCookie = (name: string, value: string, maxAge = COOKIE_CONSENT_COOKIE_MAX_AGE) => {
  if (typeof document === "undefined") {
    return
  }

  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

const persistMarketingConsent = (value: boolean) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem("marketing_consent", String(value))
  window.localStorage.setItem("cookie_consent_marketing", String(value))
  window.localStorage.setItem("consent_marketing", String(value))

  writeCookie("marketing_consent", String(value))
  writeCookie("cookie_consent_marketing", String(value))
  writeCookie("consent_marketing", String(value))
}

const persistAnalyticsConsent = (value: boolean) => {
  if (typeof window === "undefined") {
    return
  }

  window.localStorage.setItem("analytics_consent", String(value))
  writeCookie("analytics_consent", String(value))
}

export const readCookieConsent = (): CookieConsentRecord | null => {
  if (typeof window === "undefined") {
    return null
  }

  const localStorageValue = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  const parsedLocalStorage = parseJson(localStorageValue)

  if (parsedLocalStorage) {
    return parsedLocalStorage
  }

  const cookieValue = readCookie(COOKIE_CONSENT_STORAGE_KEY)
  return parseJson(cookieValue)
}

export const saveCookieConsent = (
  preferences: CookieConsentPreferences,
  source: CookieConsentRecord["source"]
) => {
  if (typeof window === "undefined") {
    return
  }

  const consentRecord: CookieConsentRecord = {
    version: 1,
    timestamp: new Date().toISOString(),
    source,
    preferences: {
      essential: true,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    },
  }

  const serialized = JSON.stringify(consentRecord)

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, serialized)
  writeCookie(COOKIE_CONSENT_STORAGE_KEY, serialized)

  persistAnalyticsConsent(consentRecord.preferences.analytics)
  persistMarketingConsent(consentRecord.preferences.marketing)
  window.__MARKETING_CONSENT__ = consentRecord.preferences.marketing

  window.dispatchEvent(new Event(COOKIE_CONSENT_EVENT))
}
