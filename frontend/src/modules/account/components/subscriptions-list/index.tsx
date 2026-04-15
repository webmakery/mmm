import {
  manageSubscription,
  type CustomerSubscription,
} from "@lib/data/subscriptions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

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

const getStatusLabel = (status?: string | null) => {
  if (!status) {
    return "Unknown"
  }

  return status.charAt(0).toUpperCase() + status.slice(1)
}

const getEffectiveStripeStatus = (subscription: CustomerSubscription) => {
  return subscription.stripe_status || subscription.status
}

const getStatusBadgeClassName = (status?: string | null) => {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800"
    case "canceled":
      return "bg-rose-100 text-rose-800"
    case "past_due":
    case "unpaid":
      return "bg-orange-100 text-orange-800"
    case "trialing":
      return "bg-blue-100 text-blue-800"
    case "incomplete":
    case "incomplete_expired":
      return "bg-gray-100 text-red-700"
    default:
      return "bg-gray-100 text-gray-700"
  }
}

const SubscriptionsList = ({
  subscriptions,
}: {
  subscriptions: CustomerSubscription[]
}) => {
  if (!subscriptions.length) {
    return (
      <div
        className="w-full flex flex-col items-center gap-y-4"
        data-testid="no-subscriptions-container"
      >
        <h2 className="text-large-semi">Nothing to see here</h2>
        <p className="text-base-regular">
          You don&apos;t have any subscriptions yet.
        </p>
        <div className="mt-4">
          <LocalizedClientLink href="/" passHref>
            <Button data-testid="continue-shopping-button">
              Continue shopping
            </Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <ul className="flex flex-col w-full" data-testid="subscriptions-list">
      {subscriptions.map((subscription) => (
        <li
          key={subscription.id}
          className="flex flex-col small:flex-row small:items-center small:justify-between gap-y-2 border-b border-gray-200 py-4"
          data-testid="subscription-item"
        >
          <div>
            <p className="text-base-semi">
              {getSubscriptionLabel(subscription)}
            </p>
            <div className="mt-1 flex flex-col gap-y-1">
              <div className="flex items-center gap-x-2">
                <span className="text-base-regular text-ui-fg-subtle">Status:</span>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-small-regular ${getStatusBadgeClassName(
                    getEffectiveStripeStatus(subscription)
                  )}`}
                >
                  {getStatusLabel(getEffectiveStripeStatus(subscription))}
                </span>
              </div>
              {subscription.cancel_at_period_end &&
                getEffectiveStripeStatus(subscription) === "active" && (
                  <p className="text-small-regular text-ui-fg-subtle">
                    Cancels at period end
                  </p>
                )}
            </div>
          </div>
          <form action={manageSubscription}>
            <Button
              type="submit"
              variant="secondary"
              data-testid="manage-subscription-button"
            >
              Manage subscription
            </Button>
          </form>
        </li>
      ))}
    </ul>
  )
}

export default SubscriptionsList
