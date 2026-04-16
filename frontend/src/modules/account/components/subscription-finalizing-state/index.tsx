"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import Spinner from "@modules/common/icons/spinner"

const REFRESH_INTERVAL_MS = 1500
const MAX_REFRESH_ATTEMPTS = 20

const SubscriptionFinalizingState = () => {
  const router = useRouter()

  useEffect(() => {
    let attempts = 0

    const interval = window.setInterval(() => {
      attempts += 1
      router.refresh()

      if (attempts >= MAX_REFRESH_ATTEMPTS) {
        window.clearInterval(interval)
      }
    }, REFRESH_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [router])

  return (
    <div className="w-full" data-testid="subscription-finalizing-state">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Subscriptions</h1>
        <p className="text-base-regular">
          View your purchased subscriptions, check their current status, and
          manage billing from your Stripe customer portal.
        </p>
      </div>
      <div className="flex flex-col items-center gap-y-4 py-8 text-ui-fg-base">
        <Spinner size={36} />
        <h2 className="text-large-semi">Finalizing your subscription…</h2>
        <p className="text-base-regular text-ui-fg-subtle">
          We&apos;re confirming your checkout session. This page will update
          automatically.
        </p>
      </div>
    </div>
  )
}

export default SubscriptionFinalizingState
