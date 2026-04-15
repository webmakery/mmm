import { InferTypeOf } from "@medusajs/framework/types"
import Subscription from "../models/subscription"

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  EXPIRED = "expired",
  FAILED = "failed"
}

export enum SubscriptionInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly"
}

export type CreateSubscriptionData = {
  interval: SubscriptionInterval
  period: number
  status?: SubscriptionStatus
  stripe_status?: string | null
  cancel_at_period_end?: boolean
  canceled_at?: Date | null
  current_period_end?: Date | null
  subscription_date?: Date
  metadata?: Record<string, unknown>
  stripe_customer_id?: string | null
  stripe_subscription_id?: string | null
  stripe_price_id?: string | null
  stripe_product_id?: string | null
}

export type SubscriptionData = InferTypeOf<typeof Subscription>
