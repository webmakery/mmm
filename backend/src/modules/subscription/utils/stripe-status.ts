import Stripe from "stripe"
import { SubscriptionStatus } from "../types"

export type StoreSubscriptionDisplayStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"
  | "unpaid"
  | "expired"
  | "failed"
  | "unknown"

const canceledAliases = new Set(["canceled", "cancelled", "incomplete_expired"])
const allowedDisplayStatuses = new Set<StoreSubscriptionDisplayStatus>([
  "active",
  "canceled",
  "past_due",
  "incomplete",
  "trialing",
  "unpaid",
  "expired",
  "failed",
  "unknown",
])

export const normalizeSubscriptionDisplayStatus = (
  status?: string | null
): StoreSubscriptionDisplayStatus => {
  if (!status) {
    return "unknown"
  }

  const normalized = status.toLowerCase().trim().replace(/\s+/g, "_")

  if (canceledAliases.has(normalized)) {
    return "canceled"
  }

  if (allowedDisplayStatuses.has(normalized as StoreSubscriptionDisplayStatus)) {
    return normalized as StoreSubscriptionDisplayStatus
  }

  return "unknown"
}

export const mapStripeStatusToDisplayStatus = (
  status: Stripe.Subscription.Status
): StoreSubscriptionDisplayStatus => {
  return normalizeSubscriptionDisplayStatus(status)
}

export const mapStripeStatusToInternalStatus = (
  status: Stripe.Subscription.Status
): SubscriptionStatus => {
  if (status === "canceled" || status === "incomplete_expired") {
    return SubscriptionStatus.CANCELED
  }

  if (status === "past_due" || status === "unpaid" || status === "incomplete") {
    return SubscriptionStatus.FAILED
  }

  return SubscriptionStatus.ACTIVE
}
