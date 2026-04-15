import { Module } from "@medusajs/framework/utils"
import SubscriptionPlanModuleService from "./service"

export const SUBSCRIPTION_PLAN_MODULE = "subscriptionPlanModuleService"

export default Module(SUBSCRIPTION_PLAN_MODULE, {
  service: SubscriptionPlanModuleService,
})
