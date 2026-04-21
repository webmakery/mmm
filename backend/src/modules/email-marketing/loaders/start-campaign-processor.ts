import { LoaderOptions, INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../constants"
import EmailMarketingModuleService from "../service"

const PROCESSOR_INTERVAL_MS = Number(process.env.EMAIL_MARKETING_PROCESSOR_INTERVAL_MS || 60_000)
const EMAIL_MARKETING_MODULE_SERVICE = `${EMAIL_MARKETING_MODULE}ModuleService`

const resolveEmailMarketingService = (container: LoaderOptions["container"]): EmailMarketingModuleService => {
  try {
    return container.resolve(EMAIL_MARKETING_MODULE)
  } catch {
    return container.resolve(EMAIL_MARKETING_MODULE_SERVICE)
  }
}

export default async function startEmailMarketingCampaignProcessor({ container }: LoaderOptions) {
  if (process.env.EMAIL_MARKETING_PROCESSOR_DISABLED === "true") {
    return
  }

  const logger = container.resolve("logger")
  let isRunning = false

  const runProcessor = async () => {
    if (isRunning) {
      return
    }

    isRunning = true

    try {
      let notificationModuleService: INotificationModuleService

      try {
        notificationModuleService = container.resolve(Modules.NOTIFICATION)
      } catch {
        logger.warn("[email-marketing] notification module is unavailable, skipping campaign processor run")
        return
      }

      const emailMarketingService = resolveEmailMarketingService(container)
      const scheduledResult = await emailMarketingService.processDueScheduledCampaigns(notificationModuleService)
      const automatedResult = await emailMarketingService.processQueuedAutomatedCampaignLogs(notificationModuleService)

      if (scheduledResult.processed_count > 0 || automatedResult.processed_count > 0) {
        logger.info(
          `[email-marketing] in-process processor sent scheduled=${scheduledResult.processed_count}, automated=${automatedResult.processed_count}`
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      logger.error(`[email-marketing] in-process processor failed: ${message}`)
    } finally {
      isRunning = false
    }
  }

  void runProcessor()
  setInterval(() => {
    void runProcessor()
  }, PROCESSOR_INTERVAL_MS)
}
