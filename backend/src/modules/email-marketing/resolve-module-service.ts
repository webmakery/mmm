import type { LoaderOptions, MedusaContainer } from "@medusajs/framework/types"
import type EmailMarketingModuleService from "./service"
import { EMAIL_MARKETING_MODULE, LEGACY_EMAIL_MARKETING_MODULE } from "./constants"

export const EMAIL_MARKETING_SERVICE_CANDIDATES = [
  EMAIL_MARKETING_MODULE,
  LEGACY_EMAIL_MARKETING_MODULE,
  `${LEGACY_EMAIL_MARKETING_MODULE}ModuleService`,
  `${LEGACY_EMAIL_MARKETING_MODULE}Service`,
] as const

type ContainerWithResolve = LoaderOptions["container"] | MedusaContainer

const isEmailMarketingService = (value: unknown): value is EmailMarketingModuleService => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.processDueScheduledCampaigns === "function" &&
    typeof candidate.processQueuedAutomatedCampaignLogs === "function"
  )
}

export const resolveEmailMarketingService = (container: ContainerWithResolve): EmailMarketingModuleService | null => {
  for (const candidate of EMAIL_MARKETING_SERVICE_CANDIDATES) {
    try {
      const resolved = container.resolve(candidate)

      if (isEmailMarketingService(resolved)) {
        return resolved
      }
    } catch {
      continue
    }
  }

  return null
}
