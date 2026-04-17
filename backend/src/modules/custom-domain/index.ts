import { Module } from "@medusajs/framework/utils"
import CustomDomainModuleService from "./service"

export const CUSTOM_DOMAIN_MODULE = "customDomainModuleService"

export default Module(CUSTOM_DOMAIN_MODULE, {
  service: CustomDomainModuleService,
})
