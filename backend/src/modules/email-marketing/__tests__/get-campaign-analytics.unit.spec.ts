import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService#getCampaignAnalytics", () => {
  it("calculates campaign analytics metrics from campaign logs", async () => {
    const execute = jest.fn().mockResolvedValue([
      {
        total_recipients: 10,
        sent_count: 8,
        delivered_count: 7,
        failed_count: 2,
        opened_count: 5,
        clicked_count: 3,
      },
    ])

    const analytics = await EmailMarketingModuleService.prototype.getCampaignAnalytics.call(
      {},
      "campaign_123",
      { manager: { execute } }
    )

    expect(execute).toHaveBeenCalledWith(expect.stringContaining("from email_campaign_log"), ["campaign_123"])
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
    const execute = jest.fn().mockResolvedValue([
      {
        total_recipients: 0,
        sent_count: 0,
        delivered_count: 0,
        failed_count: 0,
        opened_count: 0,
        clicked_count: 0,
      },
    ])

    const analytics = await EmailMarketingModuleService.prototype.getCampaignAnalytics.call(
      {},
      "campaign_empty",
      { manager: { execute } }
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
})
