import { MedusaService } from "@medusajs/framework/utils"
import SubscriptionInfrastructure from "./models/subscription-infrastructure"
import StripeWebhookEvent from "./models/stripe-webhook-event"

class SubscriptionInfrastructureModuleService extends MedusaService({
  SubscriptionInfrastructure,
  StripeWebhookEvent,
}) {}

export default SubscriptionInfrastructureModuleService
