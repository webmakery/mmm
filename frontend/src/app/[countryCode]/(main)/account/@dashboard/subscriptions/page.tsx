import { Metadata } from "next"
import { notFound } from "next/navigation"

import SubscriptionsList from "@modules/account/components/subscriptions-list"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"
import {
  CustomerSubscription,
  getCustomerSubscriptions,
  syncSubscriptionFromCheckoutSession,
} from "@lib/data/subscriptions"
import { getSubscriptionStatusLabel } from "@lib/util/subscription-status"

export const metadata: Metadata = {
  title: "Subscriptions",
  description: "View and manage your subscriptions.",
}

const getSubscriptionLabel = (subscription: CustomerSubscription) => {
  const itemTitle = subscription.metadata?.item_title
  const productTitle = subscription.metadata?.product_title
  const orderId = subscription.metadata?.main_order_id

  if (typeof itemTitle === "string" && itemTitle) {
    return itemTitle
  }

  if (typeof productTitle === "string" && productTitle) {
    return productTitle
  }

  if (typeof orderId === "string" && orderId) {
    return `Subscription from order #${orderId}`
  }

  return "Subscription"
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolvedSearchParams = (await searchParams) || {}
  const checkoutSessionId = resolvedSearchParams.session_id
  let checkoutSubscription: CustomerSubscription | null = null

  if (typeof checkoutSessionId === "string" && checkoutSessionId) {
    const syncResponse = await syncSubscriptionFromCheckoutSession(
      checkoutSessionId
    ).catch(() => null)
    checkoutSubscription = syncResponse?.subscription || null
  }

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
      {checkoutSubscription && (
        <div className="mb-8 flex flex-col gap-y-4 border border-gray-200 p-4">
          <h2 className="text-large-semi">Thank you for your purchase!</h2>
          <p className="text-base-regular">
            Subscription status:{" "}
            {getSubscriptionStatusLabel(checkoutSubscription.status)}
          </p>
          <div>
            <p className="text-base-semi">
              {getSubscriptionLabel(checkoutSubscription)}
            </p>
            <p className="text-base-regular text-ui-fg-subtle">
              Subscription ID: {checkoutSubscription.id}
            </p>
          </div>
          <div>
            <LocalizedClientLink href="/account" passHref>
              <Button variant="secondary">Go to account</Button>
            </LocalizedClientLink>
          </div>
        </div>
      )}
      <SubscriptionsList subscriptions={subscriptions} />
    </div>
  )
}
