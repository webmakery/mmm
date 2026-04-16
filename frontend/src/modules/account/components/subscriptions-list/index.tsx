import {
  manageSubscription,
  type CustomerSubscription,
} from "@lib/data/subscriptions"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge, Button } from "@medusajs/ui"

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

  if (status === "cancel_at_period_end") {
    return "Cancel at period end"
  }

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

const getStatusColor = (status?: string | null) => {
  if (!status) {
    return "grey" as const
  }

  if (status === "active") {
    return "green" as const
  }

  if (status === "cancel_at_period_end" || status === "trialing") {
    return "orange" as const
  }

  if (status === "canceled" || status === "past_due" || status === "incomplete" || status === "unpaid") {
    return "red" as const
  }

  return "grey" as const
}

const SubscriptionsList = ({
  subscriptions,
}: {
  subscriptions: CustomerSubscription[]
}) => {
  const uniqueSubscriptions = Array.from(
    subscriptions.reduce((acc, subscription) => {
      const dedupeKey = subscription.stripe_subscription_id || subscription.id

      if (!acc.has(dedupeKey)) {
        acc.set(dedupeKey, subscription)
      }

      return acc
    }, new Map<string, CustomerSubscription>())
  ).map(([, subscription]) => subscription)

  if (!uniqueSubscriptions.length) {
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
      {uniqueSubscriptions.map((subscription) => {
        const infrastructureStatus = subscription.infrastructure_status
        const hasInfrastructureStatus = typeof infrastructureStatus === "string" && infrastructureStatus.length > 0
        const isDeletedInfrastructure =
          infrastructureStatus === "deleted" || infrastructureStatus === "deleting"
        const hasActiveServer = hasInfrastructureStatus && !isDeletedInfrastructure
        const showServerIp = hasActiveServer && !!subscription.server_ip

        return (
          <li
            key={subscription.id}
            className="flex flex-col small:flex-row small:items-center small:justify-between gap-y-2 border-b border-gray-200 py-4"
            data-testid="subscription-item"
          >
            <div>
              <p className="text-base-semi">
                {getSubscriptionLabel(subscription)}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge color={getStatusColor(subscription.display_status || subscription.status)}>
                  {getStatusLabel(subscription.display_status || subscription.status)}
                </Badge>
                {subscription.server_cpu ? <Badge color="grey">{subscription.server_cpu} vCPU</Badge> : null}
                {subscription.server_ram_gb ? (
                  <Badge color="grey">{subscription.server_ram_gb} GB RAM</Badge>
                ) : null}
                {showServerIp ? (
                  <Badge color="grey">IP: {subscription.server_ip}</Badge>
                ) : hasInfrastructureStatus ? (
                  <Badge color="grey">
                    {isDeletedInfrastructure ? "Server deleted" : "No active server IP"}
                  </Badge>
                ) : null}
                {subscription.server_region ? <Badge color="grey">{subscription.server_region}</Badge> : null}
                {subscription.server_type ? <Badge color="grey">{subscription.server_type}</Badge> : null}
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
        )
      })}
    </ul>
  )
}

export default SubscriptionsList
