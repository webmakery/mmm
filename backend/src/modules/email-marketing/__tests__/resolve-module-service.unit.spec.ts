import { resolveEmailMarketingService, EMAIL_MARKETING_SERVICE_CANDIDATES } from "../resolve-module-service"

describe("resolveEmailMarketingService", () => {
  it("resolves the module service from the fallback emailMarketingService key", () => {
    const service = {
      processDueScheduledCampaigns: jest.fn(),
      processQueuedAutomatedCampaignLogs: jest.fn(),
    }

    const container = {
      resolve: jest.fn((key: string) => {
        if (key === "emailMarketingService") {
          return service
        }

        throw new Error(`missing ${key}`)
      }),
    }

    const resolved = resolveEmailMarketingService(container as any)

    expect(resolved).toBe(service)
    expect(container.resolve).toHaveBeenCalledTimes(EMAIL_MARKETING_SERVICE_CANDIDATES.length)
  })

  it("returns null when no candidate key resolves to a valid service shape", () => {
    const container = {
      resolve: jest.fn((key: string) => {
        if (key === EMAIL_MARKETING_SERVICE_CANDIDATES[0]) {
          return { processDueScheduledCampaigns: "not-a-function" }
        }

        throw new Error(`missing ${key}`)
      }),
    }

    const resolved = resolveEmailMarketingService(container as any)

    expect(resolved).toBeNull()
  })
})
