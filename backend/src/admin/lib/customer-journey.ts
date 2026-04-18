export type JourneyRollup = {
  first_seen_at?: string | null
  signup_started_at?: string | null
  signup_completed_at?: string | null
  first_order_at?: string | null
  first_payment_captured_at?: string | null
  last_event_at?: string | null
  last_event_name?: string | null
  latest_source?: string | null
  latest_campaign?: string | null
}

export type JourneyEvent = {
  event_name?: string | null
  occurred_at?: string | null
}

export type JourneyDebug = {
  customer_id: string
  rollup?: JourneyRollup | null
  recent_events?: JourneyEvent[]
}

export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString()
}

export const eventCount = (events: JourneyEvent[] | undefined, eventName: string) =>
  events?.filter((event) => event.event_name === eventName).length ?? 0

export const computeIntentScore = (journey: JourneyDebug | null) => {
  const events = journey?.recent_events ?? []

  let score = 0
  score += eventCount(events, "product_viewed") * 10
  score += eventCount(events, "checkout_started") * 25
  score += eventCount(events, "order_placed") * 30
  score += eventCount(events, "payment_captured") * 35

  return Math.min(100, score)
}

export const computeJourneyStage = (journey: JourneyDebug | null) => {
  const rollup = journey?.rollup
  const ordersCount = eventCount(journey?.recent_events, "order_placed")

  if (ordersCount > 1 || (rollup?.first_payment_captured_at && ordersCount > 1)) {
    return "Repeat customer"
  }

  if (rollup?.first_payment_captured_at || rollup?.first_order_at) {
    return "Buyer"
  }

  if (rollup?.signup_completed_at) {
    return "Signed up"
  }

  if (rollup?.signup_started_at) {
    return "Signup started"
  }

  if (rollup?.first_seen_at) {
    return "Aware"
  }

  return "Unknown"
}

export const getFlags = (journey: JourneyDebug | null) => {
  const events = journey?.recent_events ?? []
  const intentScore = computeIntentScore(journey)
  const ordersCount = eventCount(events, "order_placed")
  const paidOrdersCount = eventCount(events, "payment_captured")
  const hasCheckoutStarted = eventCount(events, "checkout_started") > 0

  const flags: string[] = []

  if (hasCheckoutStarted && ordersCount === 0) {
    flags.push("Abandoned checkout")
  }

  if (intentScore >= 70) {
    flags.push("High intent")
  }

  if (journey?.rollup?.signup_completed_at && !journey?.rollup?.first_order_at) {
    flags.push("Signed up, no purchase")
  }

  if (paidOrdersCount === 1) {
    flags.push("First-time buyer")
  }

  if (paidOrdersCount > 1) {
    flags.push("Repeat customer")
  }

  return flags
}

export const getNextBestAction = (flags: string[]) => {
  if (flags.includes("Abandoned checkout")) {
    return "Send abandoned checkout recovery message."
  }

  if (flags.includes("Signed up, no purchase")) {
    return "Trigger welcome offer for first purchase."
  }

  if (flags.includes("First-time buyer")) {
    return "Send cross-sell recommendation."
  }

  return "Review timeline and follow up manually."
}
