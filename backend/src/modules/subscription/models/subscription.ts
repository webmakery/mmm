import { model } from "@medusajs/framework/utils"
import { SubscriptionInterval, SubscriptionStatus } from "../types"

const Subscription = model.define("subscription", {
  id: model.id().primaryKey(),
  status: model.enum(SubscriptionStatus)
    .default(SubscriptionStatus.ACTIVE),
  stripe_status: model.text().nullable(),
  cancel_at_period_end: model.boolean().default(false),
  canceled_at: model.dateTime().nullable(),
  current_period_end: model.dateTime().nullable(),
  interval: model.enum(SubscriptionInterval),
  period: model.number(),
  subscription_date: model.dateTime(),
  last_order_date: model.dateTime(),
  next_order_date: model.dateTime().index().nullable(),
  expiration_date: model.dateTime().index(),
  metadata: model.json().nullable(),
  stripe_customer_id: model.text().nullable(),
  stripe_subscription_id: model.text().nullable(),
  stripe_price_id: model.text().nullable(),
  stripe_product_id: model.text().nullable()
})

export default Subscription
