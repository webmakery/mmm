import { MedusaError } from "@medusajs/framework/utils"
import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService#clearCampaignAnalyticsLogs", () => {
  it("archives existing metrics before clearing campaign logs", async () => {
    const execute = jest.fn().mockResolvedValue(undefined)
    const updateEmailCampaigns = jest.fn().mockResolvedValue({})
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({
        id: "camp_1",
        status: "sent",
        metadata: {
          analytics_archive: {
            total_recipients: 5,
            sent_count: 5,
            delivered_count: 4,
            failed_count: 1,
            opened_count: 3,
            clicked_count: 2,
          },
        },
      }),
      getLiveCampaignAnalyticsAggregate: jest.fn().mockResolvedValue({
        total_recipients: 3,
        sent_count: 3,
        delivered_count: 2,
        failed_count: 1,
        opened_count: 1,
        clicked_count: 1,
      }),
      normalizeAggregate: EmailMarketingModuleService.prototype["normalizeAggregate"],
      mergeAggregates: EmailMarketingModuleService.prototype["mergeAggregates"],
      updateEmailCampaigns,
    }

    const result = await EmailMarketingModuleService.prototype.clearCampaignAnalyticsLogs.call(service, "camp_1", {
      manager: { execute },
    })

    expect(result.cleared_count).toBe(3)
    expect(result.archived_analytics).toEqual({
      total_recipients: 8,
      sent_count: 8,
      delivered_count: 6,
      failed_count: 2,
      opened_count: 4,
      clicked_count: 3,
    })
    expect(execute).toHaveBeenCalledWith(expect.stringContaining("update email_campaign_log"), ["camp_1"])
    expect(updateEmailCampaigns).toHaveBeenCalled()
  })

  it("blocks clearing logs for automated campaigns", async () => {
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({
        id: "camp_auto",
        status: "automated",
      }),
    }

    await expect(
      EmailMarketingModuleService.prototype.clearCampaignAnalyticsLogs.call(service, "camp_auto", {
        manager: { execute: jest.fn() },
      })
    ).rejects.toBeInstanceOf(MedusaError)
  })
})
