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

const SubscriptionsList = ({
  subscriptions,
}: {
  subscriptions: CustomerSubscription[]
}) => {
  if (!subscriptions.length) {
    return (
      <div
        className="flex w-full flex-col gap-4 rounded-lg border border-ui-border-base bg-ui-bg-base p-6"
        data-testid="no-subscriptions-container"
      >
        <h2 className="text-large-semi">Nothing to see here</h2>
        <p className="text-base-regular">
          You don&apos;t have any subscriptions yet.
        </p>
        <div className="flex justify-end pt-2">
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
    <ul
      className="flex w-full flex-col rounded-lg border border-ui-border-base bg-ui-bg-base"
      data-testid="subscriptions-list"
    >
      {subscriptions.map((subscription) => (
        <li
          key={subscription.id}
          className="flex flex-col gap-3 px-5 py-4 small:flex-row small:items-center small:justify-between small:gap-4 border-b border-ui-border-base last:border-b-0"
          data-testid="subscription-item"
        >
          <div>
            <p className="text-base-semi">
              {getSubscriptionLabel(subscription)}
            </p>
            <p className="text-base-regular text-ui-fg-subtle">
              Status: {getStatusLabel(subscription.status)}
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
