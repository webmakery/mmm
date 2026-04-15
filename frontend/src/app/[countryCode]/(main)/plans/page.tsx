import { Metadata } from "next"

import PlanList from "@modules/subscription/components/plan-list"
import { listSubscriptionPlans } from "@lib/data/subscription-plans"
import { syncSubscriptionFromCheckoutSession } from "@lib/data/subscriptions"
import { getSubscriptionStatusLabel } from "@lib/util/subscription-status"

export const metadata: Metadata = {
  title: "Plans",
  description: "Choose a subscription plan.",
}

export default async function PlansPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const checkoutSessionId = resolvedSearchParams.session_id
  const checkoutError = resolvedSearchParams.checkout_error === "1"
  const syncedSubscription =
    typeof checkoutSessionId === "string" && checkoutSessionId
      ? (await syncSubscriptionFromCheckoutSession(checkoutSessionId).catch(() => null))
          ?.subscription || null
      : null

  const plans = (await listSubscriptionPlans().catch(() => null)) || []

  return (
    <div className="content-container py-10 small:py-12">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Plans</h1>
        <p className="text-base-regular">
          Choose a subscription plan and continue to Stripe checkout to start
          your subscription.
        </p>
      </div>
      {checkoutError && (
        <div className="mb-8 flex flex-col gap-y-2 border border-gray-200 p-4">
          <h2 className="text-large-semi">Unable to start checkout</h2>
          <p className="text-base-regular">
            Please try again. If the issue continues, contact support.
          </p>
        </div>
      )}
      {syncedSubscription && (
        <div className="mb-8 flex flex-col gap-y-2 border border-gray-200 p-4">
          <h2 className="text-large-semi">Thanks for subscribing!</h2>
          <p className="text-base-regular">
            Status: {getSubscriptionStatusLabel(syncedSubscription.status)}
          </p>
          <p className="text-base-regular text-ui-fg-subtle">
            We linked your purchase using your checkout email. Use your email to
            sign in or create credentials in account setup if needed.
          </p>
        </div>
      )}
      <PlanList plans={plans} />
    </div>
  )
}
