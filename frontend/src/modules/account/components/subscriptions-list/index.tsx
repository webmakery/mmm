import {
  manageSubscription,
  type CustomerSubscription,
} from "@lib/data/subscriptions"
import { getSubscriptionStatusLabel } from "@lib/util/subscription-status"
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
            <p className="text-base-regular text-ui-fg-subtle">
              Status: {getSubscriptionStatusLabel(subscription.status)}
            </p>
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
