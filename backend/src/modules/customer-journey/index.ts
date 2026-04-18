import { Module } from "@medusajs/framework/utils"
import CustomerJourneyModuleService from "./service"

export const CUSTOMER_JOURNEY_MODULE = "customer-journey"

export default Module(CUSTOMER_JOURNEY_MODULE, {
  service: CustomerJourneyModuleService,
})
