import { subscribeToPlan, type StoreSubscriptionPlan } from "@lib/data/subscription-plans"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

const getIntervalLabel = (interval: StoreSubscriptionPlan["interval"]) => {
  return interval === "yearly" ? "Yearly" : "Monthly"
}

const PlanList = ({ plans }: { plans: StoreSubscriptionPlan[] }) => {
  if (!plans.length) {
    return (
      <div
        className="w-full flex flex-col items-center gap-y-4"
        data-testid="no-plans-container"
      >
        <h2 className="text-large-semi">Nothing to see here</h2>
        <p className="text-base-regular">
          We don&apos;t have subscription plans available right now.
        </p>
        <div className="mt-4">
          <LocalizedClientLink href="/" passHref>
            <Button data-testid="continue-shopping-button">Continue shopping</Button>
          </LocalizedClientLink>
        </div>
      </div>
    )
  }

  return (
    <ul className="flex flex-col w-full" data-testid="plans-list">
      {plans.map((plan) => (
        <li
          key={plan.id}
          className="flex flex-col small:flex-row small:items-center small:justify-between gap-y-2 border-b border-gray-200 py-4"
          data-testid="plan-item"
        >
          <div>
            <p className="text-base-semi">{plan.name}</p>
            <p className="text-base-regular text-ui-fg-subtle">
              Billing cycle: {getIntervalLabel(plan.interval)}
            </p>
          </div>
          <form action={subscribeToPlan}>
            <input type="hidden" name="plan_id" value={plan.id} />
            <Button type="submit" data-testid="subscribe-plan-button">
              Subscribe
            </Button>
          </form>
        </li>
      ))}
    </ul>
  )
}

export default PlanList
