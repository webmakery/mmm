import { model } from "@medusajs/framework/utils"

const SubscriptionInfrastructureAdminAuditLog = model.define(
  "subscription_infrastructure_admin_audit_log",
  {
    id: model.id().primaryKey(),
    infrastructure_id: model.text(),
    action: model.text(),
    actor_id: model.text().nullable(),
    details: model.json().nullable(),
  }
)

export default SubscriptionInfrastructureAdminAuditLog
