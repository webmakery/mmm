import { MedusaService } from "@medusajs/framework/utils"
import SubscriptionInfrastructure from "./models/subscription-infrastructure"
import StripeWebhookEvent from "./models/stripe-webhook-event"
import SubscriptionInfrastructureProvisionAttempt from "./models/subscription-infrastructure-provision-attempt"
import SubscriptionInfrastructureAdminAuditLog from "./models/subscription-infrastructure-admin-audit-log"

class SubscriptionInfrastructureModuleService extends MedusaService({
  SubscriptionInfrastructure,
  StripeWebhookEvent,
  SubscriptionInfrastructureProvisionAttempt,
  SubscriptionInfrastructureAdminAuditLog,
}) {}

export default SubscriptionInfrastructureModuleService
