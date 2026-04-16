import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import Stripe from "stripe"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../../../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../../../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_MODULE } from "../../../../../modules/subscription"
import SubscriptionModuleService from "../../../../../modules/subscription/service"
import { SubscriptionStatus } from "../../../../../modules/subscription/types"

type StripeSubscriptionStatusView =
  | "active"
  | "canceled"
  | "cancel_at_period_end"
  | "past_due"
  | "incomplete"
  | "unpaid"
  | "paused"
  | "trialing"
  | "incomplete_expired"
  | "unknown"

const resolveDisplayStatus = (subscription: Stripe.Subscription): StripeSubscriptionStatusView => {
  if (subscription.cancel_at_period_end && subscription.status === "active") {
    return "cancel_at_period_end"
  }

  if (subscription.status === "trialing") {
    return subscription.cancel_at_period_end ? "cancel_at_period_end" : "active"
  }

  return subscription.status
}

const mapStripeStatusToStoredStatus = (status: StripeSubscriptionStatusView): SubscriptionStatus => {
  if (status === "canceled" || status === "incomplete_expired") {
    return SubscriptionStatus.CANCELED
  }

  if (
    status === "past_due" ||
    status === "unpaid" ||
    status === "incomplete" ||
    status === "paused"
  ) {
    return SubscriptionStatus.FAILED
  }

  return SubscriptionStatus.ACTIVE
}

const getDedupeKey = (subscription: Record<string, unknown>) =>
  String(subscription.stripe_subscription_id || subscription.id || "")

const pickMostCompleteSubscription = (
  current: Record<string, unknown>,
  candidate: Record<string, unknown>
) => {
  const currentUpdatedAt = String(current.updated_at || "")
  const candidateUpdatedAt = String(candidate.updated_at || "")

  if (candidateUpdatedAt > currentUpdatedAt) {
    return candidate
  }

  const currentMetadata = current.metadata && typeof current.metadata === "object" ? 1 : 0
  const candidateMetadata = candidate.metadata && typeof candidate.metadata === "object" ? 1 : 0

  if (candidateMetadata > currentMetadata) {
    return candidate
  }

  return current
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const actorId = req.auth_context.actor_id

  if (!actorId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You must be authenticated to view subscriptions."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [customer],
  } = await query.graph({
    entity: "customer",
    fields: [
      "id",
      "email",
      "subscriptions.*",
      "subscriptions.stripe_customer_id",
      "subscriptions.stripe_subscription_id",
      "subscriptions.stripe_price_id",
      "subscriptions.stripe_product_id",
    ],
    filters: {
      id: [actorId],
    },
  })

  if (!customer) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Customer not found.")
  }

  const subscriptionsById = new Map<string, Record<string, unknown>>()

  for (const subscription of customer.subscriptions || []) {
    if (subscription?.id) {
      const subscriptionRecord = subscription as Record<string, unknown>
      const dedupeKey = getDedupeKey(subscriptionRecord)
      const existing = subscriptionsById.get(dedupeKey)

      subscriptionsById.set(
        dedupeKey,
        existing
          ? pickMostCompleteSubscription(existing, subscriptionRecord)
          : subscriptionRecord
      )
    }
  }

  const stripeApiKey = process.env.STRIPE_API_KEY
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )
  const subscriptionModuleService = req.scope.resolve<SubscriptionModuleService>(SUBSCRIPTION_MODULE)
  const stripeStatusesBySubscriptionId = new Map<string, StripeSubscriptionStatusView>()

  if (stripeApiKey && customer.email) {
    const stripe = new Stripe(stripeApiKey)

    const stripeCustomers = await stripe.customers.list({
      email: customer.email,
      limit: 100,
    })

    const stripeCustomerIds = stripeCustomers.data.map((item) => item.id)

    if (stripeCustomerIds.length) {
      const { data: stripeSubscriptions } = await query.graph({
        entity: "subscription",
        fields: [
          "*",
          "stripe_customer_id",
          "stripe_subscription_id",
          "stripe_price_id",
          "stripe_product_id",
        ],
        filters: {
          stripe_customer_id: stripeCustomerIds,
        },
      })

      for (const subscription of stripeSubscriptions) {
        if (subscription?.id) {
          const subscriptionRecord = subscription as Record<string, unknown>
          const dedupeKey = getDedupeKey(subscriptionRecord)
          const existing = subscriptionsById.get(dedupeKey)

          subscriptionsById.set(
            dedupeKey,
            existing
              ? pickMostCompleteSubscription(existing, subscriptionRecord)
              : subscriptionRecord
          )
        }
      }
    }

    const stripeSubscriptionIds = Array.from(subscriptionsById.values())
      .map((subscription) => String(subscription.stripe_subscription_id || ""))
      .filter((id) => !!id)

    await Promise.all(
      stripeSubscriptionIds.map(async (stripeSubscriptionId) => {
        try {
          const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)
          const displayStatus = resolveDisplayStatus(stripeSubscription)
          stripeStatusesBySubscriptionId.set(stripeSubscriptionId, displayStatus)
        } catch {
          stripeStatusesBySubscriptionId.set(stripeSubscriptionId, "unknown")
        }
      })
    )
  }

  const infrastructureByStripeSubscriptionId = new Map<string, Record<string, unknown>>()

  const stripeSubscriptionIds = Array.from(subscriptionsById.values())
    .map((subscription) => String(subscription.stripe_subscription_id || ""))
    .filter((id) => !!id)

  await Promise.all(
    stripeSubscriptionIds.map(async (stripeSubscriptionId) => {
      const [infrastructure] = await infraService.listSubscriptionInfrastructures({
        stripe_subscription_id: stripeSubscriptionId,
      })

      if (infrastructure) {
        infrastructureByStripeSubscriptionId.set(
          stripeSubscriptionId,
          infrastructure as unknown as Record<string, unknown>
        )
      }
    })
  )

  const subscriptions = await Promise.all(
    Array.from(subscriptionsById.values()).map(async (subscription) => {
      const stripeSubscriptionId = String(subscription.stripe_subscription_id || "")
      const displayStatus = stripeStatusesBySubscriptionId.get(stripeSubscriptionId)
      const infrastructure = infrastructureByStripeSubscriptionId.get(stripeSubscriptionId)

      if (displayStatus && subscription.id && displayStatus !== "unknown") {
        const storedStatus = mapStripeStatusToStoredStatus(displayStatus)

        if (subscription.status !== storedStatus) {
          await subscriptionModuleService.updateSubscriptions({
            id: String(subscription.id),
            status: storedStatus,
          })
          subscription.status = storedStatus
        }
      }

      return {
        ...subscription,
        display_status: displayStatus || subscription.status || "unknown",
        server_ip: infrastructure?.server_ip || null,
        server_cpu: infrastructure?.server_cpu || null,
        server_ram_gb: infrastructure?.server_ram_gb || null,
        server_region: infrastructure?.hetzner_region || null,
        server_type: infrastructure?.hetzner_server_type || null,
        infrastructure_status: infrastructure?.status || null,
        hetzner_server_id: infrastructure?.hetzner_server_id || null,
      }
    })
  )

  res.json({
    subscriptions,
  })
}
