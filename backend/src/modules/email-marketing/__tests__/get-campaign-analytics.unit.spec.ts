import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService#getCampaignAnalytics", () => {
  it("calculates campaign analytics metrics from campaign logs", async () => {
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({ metadata: null }),
      getLiveCampaignAnalyticsAggregate: jest.fn().mockResolvedValue({
        total_recipients: 10,
        sent_count: 8,
        delivered_count: 7,
        failed_count: 2,
        opened_count: 5,
        clicked_count: 3,
      }),
      normalizeAggregate: EmailMarketingModuleService.prototype["normalizeAggregate"],
      mergeAggregates: EmailMarketingModuleService.prototype["mergeAggregates"],
    }

    const analytics = await EmailMarketingModuleService.prototype.getCampaignAnalytics.call(
      service,
      "campaign_123",
      { manager: { execute: jest.fn() } }
    )

    expect(service.retrieveEmailCampaign).toHaveBeenCalledWith("campaign_123", {}, expect.anything())
    expect(analytics).toEqual({
      total_recipients: 10,
      sent_count: 8,
      delivered_count: 7,
      failed_count: 2,
      open_rate: 0.5,
      click_rate: 0.3,
    })
  })

  it("returns zero rates when there are no recipients", async () => {
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({
        metadata: {
          analytics_archive: {
            total_recipients: 0,
            sent_count: 0,
            delivered_count: 0,
            failed_count: 0,
            opened_count: 0,
            clicked_count: 0,
          },
        },
      }),
      getLiveCampaignAnalyticsAggregate: jest.fn().mockResolvedValue({
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        opened_count: 0,
        clicked_count: 0,
      }),
      normalizeAggregate: EmailMarketingModuleService.prototype["normalizeAggregate"],
      mergeAggregates: EmailMarketingModuleService.prototype["mergeAggregates"],
    }

    const analytics = await EmailMarketingModuleService.prototype.getCampaignAnalytics.call(
      service,
      "campaign_empty",
      { manager: { execute: jest.fn() } }
    )

    expect(analytics).toEqual({
      total_recipients: 0,
      sent_count: 0,
      delivered_count: 0,
      failed_count: 0,
      open_rate: 0,
      click_rate: 0,
    })
  })

  it("includes archived analytics after logs are cleared", async () => {
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({
        metadata: {
          analytics_archive: {
            total_recipients: 5,
            sent_count: 5,
            delivered_count: 4,
            failed_count: 1,
            opened_count: 2,
            clicked_count: 1,
          },
        },
      }),
      getLiveCampaignAnalyticsAggregate: jest.fn().mockResolvedValue({
        total_recipients: 3,
        sent_count: 3,
        delivered_count: 2,
        failed_count: 0,
        opened_count: 1,
        clicked_count: 1,
      }),
      normalizeAggregate: EmailMarketingModuleService.prototype["normalizeAggregate"],
      mergeAggregates: EmailMarketingModuleService.prototype["mergeAggregates"],
    }

    const analytics = await EmailMarketingModuleService.prototype.getCampaignAnalytics.call(service, "campaign_archived", {
      manager: { execute: jest.fn() },
    })

    expect(analytics).toEqual({
      total_recipients: 8,
      sent_count: 8,
      delivered_count: 6,
      failed_count: 1,
      open_rate: 0.375,
      click_rate: 0.25,
    })
  })
})
