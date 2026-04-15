import { Metadata } from "next"
import { notFound } from "next/navigation"

import SubscriptionsList from "@modules/account/components/subscriptions-list"
import { getCustomerSubscriptions } from "@lib/data/subscriptions"

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "View and manage your subscriptions.",
}

export default async function SubscriptionsPage() {
  const subscriptions = await getCustomerSubscriptions().catch(() => null)

  if (!subscriptions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="subscriptions-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-4">
        <h1 className="text-2xl-semi">Subscriptions</h1>
        <p className="text-base-regular">
          View your purchased subscriptions, check their current status, and
          manage billing from your Stripe customer portal.
        </p>
      </div>
      <SubscriptionsList subscriptions={subscriptions} />
    </div>
  )
}
