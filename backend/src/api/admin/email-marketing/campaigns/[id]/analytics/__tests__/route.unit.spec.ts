import { GET } from "../route"

describe("GET /admin/email-marketing/campaigns/:id/analytics", () => {
  it("returns opened statuses and analytics rates", async () => {
    const service = {
      getCampaignAnalytics: jest.fn().mockResolvedValue({
        total_recipients: 2,
        sent_count: 2,
        delivered_count: 1,
        failed_count: 0,
        open_rate: 0.5,
        click_rate: 0,
      }),
      listCampaignEmailAnalyticsLogs: jest.fn().mockResolvedValue([
        { id: "log_1", subscriber_id: "sub_1", status: "opened", opened_at: "2026-04-22T00:00:00.000Z" },
        { id: "log_2", subscriber_id: "sub_2", status: "sent", opened_at: null },
      ]),
    }
    const logger = { info: jest.fn() }
    const json = jest.fn()

    await GET(
      {
        params: { id: "camp_1" },
        scope: {
          resolve: (key: string) => (key === "logger" ? logger : service),
        },
      } as any,
      { json } as any
    )

    expect(service.getCampaignAnalytics).toHaveBeenCalledWith("camp_1")
    expect(service.listCampaignEmailAnalyticsLogs).toHaveBeenCalledWith("camp_1")
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        analytics: expect.objectContaining({ open_rate: 0.5 }),
        logs: expect.arrayContaining([expect.objectContaining({ status: "opened" })]),
      })
    )
  })
})
