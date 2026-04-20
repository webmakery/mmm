import { Module } from "@medusajs/framework/utils"
import EmailMarketingModuleService from "./service"

export const EMAIL_MARKETING_MODULE = "email_marketing"

export default Module(EMAIL_MARKETING_MODULE, {
  service: EmailMarketingModuleService,
})
