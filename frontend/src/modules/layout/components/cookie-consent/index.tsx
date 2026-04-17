"use client"

import {
  COOKIE_CONSENT_EVENT,
  DEFAULT_COOKIE_CONSENT,
  readCookieConsent,
  saveCookieConsent,
} from "@lib/analytics/consent"
import Modal from "@modules/common/components/modal"
import { Button, Heading, Text } from "@medusajs/ui"
import { useEffect, useMemo, useState } from "react"

type ConsentState = {
  analytics: boolean
  marketing: boolean
}

const getConsentState = (): ConsentState => {
  const consentRecord = readCookieConsent()

  return {
    analytics: consentRecord?.preferences.analytics ?? DEFAULT_COOKIE_CONSENT.analytics,
    marketing: consentRecord?.preferences.marketing ?? DEFAULT_COOKIE_CONSENT.marketing,
  }
}

export default function CookieConsent() {
  const [hasStoredConsent, setHasStoredConsent] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [consentState, setConsentState] = useState<ConsentState>(() => ({
    analytics: false,
    marketing: false,
  }))

  useEffect(() => {
    const existingConsent = readCookieConsent()

    if (existingConsent) {
      setHasStoredConsent(true)
      setConsentState({
        analytics: existingConsent.preferences.analytics,
        marketing: existingConsent.preferences.marketing,
      })
    }

    const onConsentUpdate = () => {
      const updated = getConsentState()
      setConsentState(updated)
      setHasStoredConsent(Boolean(readCookieConsent()))
    }

    window.addEventListener(COOKIE_CONSENT_EVENT, onConsentUpdate)

    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, onConsentUpdate)
  }, [])

  const showBanner = useMemo(() => !hasStoredConsent, [hasStoredConsent])

  const onAcceptAll = () => {
    saveCookieConsent(
      {
        essential: true,
        analytics: true,
        marketing: true,
      },
      "accept_all"
    )
    setHasStoredConsent(true)
    setShowPreferences(false)
  }

  const onRejectAll = () => {
    saveCookieConsent(
      {
        essential: true,
        analytics: false,
        marketing: false,
      },
      "reject_all"
    )
    setHasStoredConsent(true)
    setShowPreferences(false)
  }

  const onSavePreferences = () => {
    saveCookieConsent(
      {
        essential: true,
        analytics: consentState.analytics,
        marketing: consentState.marketing,
      },
      "customize"
    )
    setHasStoredConsent(true)
    setShowPreferences(false)
  }

  return (
    <>
      {showBanner ? (
        <div
          className="fixed inset-x-0 bottom-0 z-[60] border-t border-ui-border-base bg-ui-bg-base"
          role="region"
          aria-label="Cookie consent"
        >
          <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 px-4 py-4 small:flex-row small:items-end small:justify-between">
            <div className="max-w-2xl">
              <Heading level="h3" className="text-base-semi">
                We use cookies to improve your experience
              </Heading>
              <Text size="small" className="mt-2 text-ui-fg-subtle">
                Essential cookies are always active. You can accept or reject non-essential cookies, or customize your preferences.
              </Text>
              <Text size="small" className="mt-1 text-ui-fg-subtle">
                <a href="/privacy-policy" className="txt-compact-small-plus underline underline-offset-2">
                  Privacy Policy
                </a>{" "}
                ·{" "}
                <a href="/cookie-policy" className="txt-compact-small-plus underline underline-offset-2">
                  Cookie Policy
                </a>
              </Text>
            </div>

            <div className="grid grid-cols-1 gap-2 small:grid-cols-3">
              <Button variant="secondary" onClick={onRejectAll}>
                Reject all
              </Button>
              <Button variant="secondary" onClick={() => setShowPreferences(true)}>
                Customize
              </Button>
              <Button onClick={onAcceptAll}>Accept all</Button>
            </div>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className="fixed bottom-4 left-4 z-50 rounded-rounded border border-ui-border-base bg-ui-bg-base px-3 py-2 txt-compact-small-plus text-ui-fg-base shadow-elevation-card-rest"
        onClick={() => setShowPreferences(true)}
        aria-haspopup="dialog"
      >
        Cookie Settings
      </button>

      <Modal isOpen={showPreferences} close={() => setShowPreferences(false)} size="small">
        <Modal.Title>Cookie Preferences</Modal.Title>
        <div className="mt-4 flex flex-col gap-4">
          <Text size="small" className="text-ui-fg-subtle">
            Essential cookies are required for core website functionality and cannot be disabled.
          </Text>

          <div className="rounded-rounded border border-ui-border-base p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text weight="plus">Essential</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Required for security, checkout, and basic site operations.
                </Text>
              </div>
              <Text size="small" className="text-ui-fg-subtle">Always active</Text>
            </div>
          </div>

          <label className="rounded-rounded border border-ui-border-base p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text weight="plus">Analytics</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Helps us understand site usage so we can improve performance.
                </Text>
              </div>
              <input
                aria-label="Analytics cookies"
                type="checkbox"
                checked={consentState.analytics}
                onChange={(event) =>
                  setConsentState((prev) => ({ ...prev, analytics: event.target.checked }))
                }
              />
            </div>
          </label>

          <label className="rounded-rounded border border-ui-border-base p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Text weight="plus">Marketing</Text>
                <Text size="small" className="text-ui-fg-subtle">
                  Allows personalized ads and enables Meta/Facebook Pixel tracking.
                </Text>
              </div>
              <input
                aria-label="Marketing cookies"
                type="checkbox"
                checked={consentState.marketing}
                onChange={(event) =>
                  setConsentState((prev) => ({ ...prev, marketing: event.target.checked }))
                }
              />
            </div>
          </label>

          <Text size="small" className="text-ui-fg-subtle">
            <a href="/privacy-policy" className="txt-compact-small-plus underline underline-offset-2">
              Privacy Policy
            </a>{" "}
            ·{" "}
            <a href="/cookie-policy" className="txt-compact-small-plus underline underline-offset-2">
              Cookie Policy
            </a>
          </Text>

          <div className="mt-2 grid grid-cols-1 gap-2 small:grid-cols-3">
            <Button variant="secondary" onClick={onRejectAll}>
              Reject all
            </Button>
            <Button variant="secondary" onClick={onSavePreferences}>
              Save preferences
            </Button>
            <Button onClick={onAcceptAll}>Accept all</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
