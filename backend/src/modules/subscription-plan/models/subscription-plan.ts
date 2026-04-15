import { model } from "@medusajs/framework/utils"

export enum SubscriptionPlanInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

const SubscriptionPlan = model.define("subscription_plan", {
  id: model.id().primaryKey(),
  name: model.text(),
  stripe_product_id: model.text(),
  stripe_price_id: model.text(),
  interval: model.enum(SubscriptionPlanInterval),
  active: model.boolean().default(true),
  metadata: model.json().nullable(),
})

export default SubscriptionPlan
