import { model } from "@medusajs/framework/utils"

export const SubscriptionInfrastructureStatus = [
  "pending",
  "provisioning",
  "active",
  "deleting",
  "deleted",
  "failed",
] as const

const SubscriptionInfrastructure = model.define("subscription_infrastructure", {
  id: model.id().primaryKey(),
  order_id: model.text().nullable(),
  customer_id: model.text(),
  stripe_customer_id: model.text(),
  stripe_subscription_id: model.text(),
  checkout_session_id: model.text().nullable(),
  subscription_plan_id: model.text().nullable(),
  stripe_price_id: model.text().nullable(),
  stripe_invoice_id: model.text().nullable(),
  hetzner_server_id: model.text().nullable(),
  hetzner_server_name: model.text(),
  server_ip: model.text().nullable(),
  server_cpu: model.number().nullable(),
  server_ram_gb: model.number().nullable(),
  hetzner_region: model.text(),
  hetzner_server_type: model.text(),
  hetzner_image: model.text(),
  status: model.enum(SubscriptionInfrastructureStatus).default("pending"),
  last_error: model.text().nullable(),
})

export default SubscriptionInfrastructure
