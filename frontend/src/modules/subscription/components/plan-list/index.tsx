import {
  subscribeToPlan,
  type StoreSubscriptionPlan,
} from "@lib/data/subscription-plans"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button } from "@medusajs/ui"

type PlanMetadata = {
  starting_price?: string | number
  price?: string | number
  currency?: string
  period?: string
  headline?: string
  subtitle?: string
  billing_note?: string
  promo?: string
  popular_label?: string
  cta_label?: string
  security_features?: string[]
  standout_features?: string[]
}

const getPlanMetadata = (plan: StoreSubscriptionPlan): PlanMetadata => {
  if (!plan.metadata || typeof plan.metadata !== "object") {
    return {}
  }

  return plan.metadata as PlanMetadata
}

const getPlanPrice = (plan: StoreSubscriptionPlan) => {
  const metadata = getPlanMetadata(plan)

  const amount =
    metadata.starting_price ??
    metadata.price ??
    (plan.interval === "yearly" ? "2100" : "36")

  const currency = metadata.currency || "EUR"
  const period = metadata.period || "month"

  return {
    amount: String(amount),
    currency,
    period,
  }
}

const defaultSecurityFeatures = [
  "Fraud check and 3D secure checkout",
  "Simplified GDPR compliance",
  "Automated VAT collection",
]

const defaultStandoutFeatures = [
  "Best rates for domestic shipping",
  "Accept Klarna, wallets, and cards",
  "24/7 local chat support",
]

const PlanList = ({ plans }: { plans: StoreSubscriptionPlan[] }) => {
  if (!plans.length) {
    return (
      <div
        className="flex w-full flex-col items-center gap-y-4"
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
    <ul
      className="grid w-full grid-cols-1 gap-4 small:grid-cols-2 large:grid-cols-4"
      data-testid="plans-list"
    >
      {plans.map((plan, index) => {
        const metadata = getPlanMetadata(plan)
        const price = getPlanPrice(plan)
        const promo =
          metadata.promo ||
          (index === plans.length - 1
            ? "Available on a 1- or 3-year term"
            : "1 €/month for first 3 months")
        const heading = metadata.headline || plan.name
        const subtitle =
          metadata.subtitle ||
          (index === 0
            ? "For solo entrepreneurs"
            : index === plans.length - 1
              ? "For complex businesses"
              : "For small teams")
        const billingNote =
          metadata.billing_note ||
          (plan.interval === "yearly" ? "on a 3-year term" : "Starting at")
        const securityFeatures = metadata.security_features || defaultSecurityFeatures
        const standoutFeatures = metadata.standout_features || defaultStandoutFeatures
        const ctaLabel =
          metadata.cta_label ||
          (index === plans.length - 1 ? "Get started" : "Try for free")

        return (
          <li
            key={plan.id}
            className="overflow-hidden rounded-rounded border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest"
            data-testid="plan-item"
          >
            <div
              className={`px-4 py-2 text-center text-small-semi ${
                index === plans.length - 1
                  ? "bg-ui-tag-blue-bg text-ui-tag-blue-text"
                  : "bg-ui-tag-green-bg text-ui-tag-green-text"
              }`}
            >
              {promo}
            </div>

            <div className="flex h-full flex-col gap-y-5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-2xl-semi">{heading}</h2>
                  <p className="text-small-regular text-ui-fg-subtle">{subtitle}</p>
                </div>
                {metadata.popular_label && (
                  <span className="rounded-full bg-ui-tag-green-bg px-3 py-1 text-small-semi text-ui-tag-green-text">
                    {metadata.popular_label}
                  </span>
                )}
              </div>

              <div>
                <p className="text-small-regular text-ui-fg-subtle">{billingNote}</p>
                <p className="flex items-end gap-2">
                  <span className="text-3xl-semi">{price.amount} €</span>
                  <span className="pb-1 text-small-regular text-ui-fg-subtle">
                    {price.currency}/{price.period}
                  </span>
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-base-semi">Stay secure and compliant</p>
                <ul className="space-y-2">
                  {securityFeatures.map((feature) => (
                    <li key={feature} className="text-small-regular text-ui-fg-subtle">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <p className="text-base-semi">Other standout features</p>
                <ul className="space-y-2">
                  {standoutFeatures.map((feature) => (
                    <li key={feature} className="text-small-regular text-ui-fg-subtle">
                      ✓ {feature}
                    </li>
                  ))}
                </ul>
              </div>

              <form action={subscribeToPlan} className="mt-auto pt-3">
                <input type="hidden" name="plan_id" value={plan.id} />
                <Button
                  type="submit"
                  variant="primary"
                  className="h-11 w-full"
                  data-testid="subscribe-plan-button"
                >
                  {ctaLabel}
                </Button>
              </form>

              {index === plans.length - 1 && (
                <p className="text-center text-small-semi underline underline-offset-2">
                  Get in touch
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default PlanList
