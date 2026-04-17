import { Metadata } from "next"

import PlanList from "@modules/subscription/components/plan-list"
import { listSubscriptionPlans } from "@lib/data/subscription-plans"
import { Button } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Plans",
  description: "Choose a subscription plan.",
}

export default async function PlansPage() {
  const plans = (await listSubscriptionPlans().catch(() => null)) || []

  return (
    <div className="w-full bg-ui-bg-base">
      <section className="w-full border-b border-ui-border-base bg-ui-bg-subtle">
        <div className="content-container py-12 small:py-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-y-6 text-center">
            <p className="text-small-semi uppercase tracking-[0.16em] text-ui-fg-subtle">
              Plans & Pricing
            </p>
            <h1 className="text-3xl-semi small:text-4xl-semi">
              Start for free, then enjoy 1 €/month for 3 months
            </h1>
            <p className="text-base-regular text-ui-fg-subtle">
              Choose the best plan for your business. Change plans as you grow.
            </p>

            <div className="flex w-full max-w-2xl items-center gap-2 rounded-full border border-ui-border-base bg-ui-bg-base p-2">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="h-10 w-full border-0 bg-transparent px-4 text-base-regular outline-none"
              />
              <Button type="button" variant="primary" className="h-10 rounded-full px-5">
                Start for free
              </Button>
            </div>

            <p className="text-small-regular text-ui-fg-subtle">
              You agree to receive Shopify marketing emails.
            </p>
          </div>
        </div>
      </section>

      <section className="content-container py-10 small:py-12">
        <div className="mb-8 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-ui-border-base bg-ui-bg-base p-1">
            <Button type="button" variant="primary" className="h-9 rounded-full px-5">
              Pay monthly
            </Button>
            <Button type="button" variant="transparent" className="h-9 rounded-full px-5">
              Pay yearly (save 25%+)
            </Button>
          </div>
        </div>

        <PlanList plans={plans} />
      </section>
    </div>
  )
}
