import { model } from "@medusajs/framework/utils"

const SubscriptionInfrastructureProvisionAttempt = model.define(
  "subscription_infrastructure_provision_attempt",
  {
    id: model.id().primaryKey(),
    infrastructure_id: model.text(),
    attempt_number: model.number(),
    triggered_by: model.text(),
    trigger_actor_id: model.text().nullable(),
    requested_server_type: model.text().nullable(),
    requested_image: model.text().nullable(),
    requested_location: model.text().nullable(),
    provider_server_id: model.text().nullable(),
    status: model.text(),
    error_message: model.text().nullable(),
    diagnostics: model.json().nullable(),
    started_at: model.dateTime(),
    finished_at: model.dateTime().nullable(),
  }
)

export default SubscriptionInfrastructureProvisionAttempt
