import { Module } from "@medusajs/framework/utils"
import seedDefaultEmailTemplates from "./loaders/seed-default-templates"
import startEmailMarketingCampaignProcessor from "./loaders/start-campaign-processor"
import EmailMarketingModuleService from "./service"
import { EMAIL_MARKETING_MODULE } from "./constants"

export { EMAIL_MARKETING_MODULE, LEGACY_EMAIL_MARKETING_MODULE } from "./constants"

export default Module(EMAIL_MARKETING_MODULE, {
  service: EmailMarketingModuleService,
  loaders: [seedDefaultEmailTemplates, startEmailMarketingCampaignProcessor],
})
