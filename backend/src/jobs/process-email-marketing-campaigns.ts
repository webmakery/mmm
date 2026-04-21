import type { MedusaContainer, INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../modules/email-marketing"
import EmailMarketingModuleService from "../modules/email-marketing/service"

const EMAIL_MARKETING_MODULE_SERVICE = `${EMAIL_MARKETING_MODULE}ModuleService`

const resolveEmailMarketingService = (container: MedusaContainer): EmailMarketingModuleService => {
  try {
    return container.resolve(EMAIL_MARKETING_MODULE)
  } catch {
    return container.resolve(EMAIL_MARKETING_MODULE_SERVICE)
  }
}

export default async function processEmailMarketingCampaignsJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const emailMarketingService = resolveEmailMarketingService(container)
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)

  try {
    const scheduledResult = await emailMarketingService.processDueScheduledCampaigns(notificationModuleService)
    const automatedResult = await emailMarketingService.processQueuedAutomatedCampaignLogs(notificationModuleService)

    if (scheduledResult.processed_count > 0 || automatedResult.processed_count > 0) {
      logger.info(
        `[email-marketing] processed scheduled campaigns=${scheduledResult.processed_count}, automated logs=${automatedResult.processed_count}`
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    logger.error(`[email-marketing] processing job failed: ${message}`)
  }
}

export const config = {
  name: "process-email-marketing-campaigns",
  schedule: "* * * * *",
}
