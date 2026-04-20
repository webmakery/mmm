import { Metadata } from "next"

import PlanList from "@modules/subscription/components/plan-list"
import { listSubscriptionPlans } from "@lib/data/subscription-plans"

export const metadata: Metadata = {
  title: "Plans",
  description: "Choose the plan that fits your stage and growth goals.",
}

export default async function PlansPage() {
  const plans = (await listSubscriptionPlans().catch(() => null)) || []

  return (
    <div className="content-container py-10 small:py-12">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Plans</h1>
        <p className="text-base-regular">
          Start with a plan that matches your current stage. Upgrade as your
          store grows, with no migration required.
        </p>
        <p className="text-base-regular text-ui-fg-subtle">
          Clear monthly pricing, secure checkout, and support included.
        </p>
      </div>
      <PlanList plans={plans} />
    </div>
  )
}
