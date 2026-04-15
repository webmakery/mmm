import { MedusaService } from "@medusajs/framework/utils"
import SubscriptionPlan from "./models/subscription-plan"

class SubscriptionPlanModuleService extends MedusaService({
  SubscriptionPlan,
}) {}

export default SubscriptionPlanModuleService
