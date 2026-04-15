import { Module } from "@medusajs/framework/utils"
import SubscriptionInfrastructureModuleService from "./service"

export const SUBSCRIPTION_INFRASTRUCTURE_MODULE = "subscriptionInfrastructureModuleService"

export default Module(SUBSCRIPTION_INFRASTRUCTURE_MODULE, {
  service: SubscriptionInfrastructureModuleService,
})
