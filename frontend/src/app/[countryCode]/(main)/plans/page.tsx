import { Metadata } from "next"

import PlanList from "@modules/subscription/components/plan-list"
import { listSubscriptionPlans } from "@lib/data/subscription-plans"

export const metadata: Metadata = {
  title: "Plans",
  description: "Choose a subscription plan.",
}

export default async function PlansPage() {
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
      <PlanList plans={plans} />
    </div>
  )
}
