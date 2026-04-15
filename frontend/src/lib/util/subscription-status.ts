export type SubscriptionDisplayStatus =
  | "active"
  | "canceled"
  | "past_due"
  | "incomplete"
  | "trialing"
  | "unpaid"
  | "expired"
  | "failed"
  | "unknown"

const labels: Record<SubscriptionDisplayStatus, string> = {
  active: "Active",
  canceled: "Canceled",
  past_due: "Past due",
  incomplete: "Incomplete",
  trialing: "Trialing",
  unpaid: "Unpaid",
  expired: "Expired",
  failed: "Failed",
  unknown: "Unknown",
}

const canceledAliases = new Set(["canceled", "cancelled", "incomplete_expired"])

export const normalizeSubscriptionStatus = (
  status?: string | null
): SubscriptionDisplayStatus => {
  if (!status) {
    return "unknown"
  }

  const normalized = status.toLowerCase().trim().replace(/\s+/g, "_")

  if (canceledAliases.has(normalized)) {
    return "canceled"
  }

  if (normalized in labels) {
    return normalized as SubscriptionDisplayStatus
  }

  return "unknown"
}

export const getSubscriptionStatusLabel = (status?: string | null): string => {
  return labels[normalizeSubscriptionStatus(status)]
}
