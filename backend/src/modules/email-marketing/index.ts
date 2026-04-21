import { Module } from "@medusajs/framework/utils"
import seedDefaultEmailTemplates from "./loaders/seed-default-templates"
import startEmailMarketingCampaignProcessor from "./loaders/start-campaign-processor"
import EmailMarketingModuleService from "./service"

export const EMAIL_MARKETING_MODULE = "email_marketing"

export default Module(EMAIL_MARKETING_MODULE, {
  service: EmailMarketingModuleService,
  loaders: [seedDefaultEmailTemplates, startEmailMarketingCampaignProcessor],
})
