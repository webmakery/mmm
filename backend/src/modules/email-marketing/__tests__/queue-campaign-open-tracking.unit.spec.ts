import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService queue campaign open tracking", () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  it("uses backend urls for tracking base url and ignores STORE_CORS", () => {
    process.env.EMAIL_MARKETING_TRACKING_BASE_URL = ""
    process.env.MEDUSA_BACKEND_URL = "https://backend.example.com"
    process.env.BACKEND_URL = ""
    process.env.STORE_CORS = "https://store.example.com"

    const getTrackingBaseUrl = EmailMarketingModuleService.prototype["getTrackingBaseUrl"]
    expect(getTrackingBaseUrl.call({ sanitizeOrigin: EmailMarketingModuleService.prototype["sanitizeOrigin"] })).toBe(
      "https://backend.example.com"
    )
  })

  it("injects a tracking pixel url in outgoing campaign email html", async () => {
    process.env.JWT_SECRET = "queue-test-secret"
    process.env.EMAIL_MARKETING_TRACKING_BASE_URL = "https://backend.example.com"

    const createNotifications = jest.fn().mockResolvedValue(undefined)
    const service = {
      retrieveEmailCampaign: jest.fn().mockResolvedValue({
        id: "camp_123",
        template_id: "tpl_123",
        status: "draft",
        audience_filter: {},
        name: "Spring",
        subject: "Hello",
      }),
      retrieveEmailTemplate: jest.fn().mockResolvedValue({
        html_content: "<html><body><p>Hi</p></body></html>",
        text_content: "Hi",
        subject: "Subj",
      }),
      normalizeAudienceFilter: EmailMarketingModuleService.prototype["normalizeAudienceFilter"],
      listSubscribers: jest.fn().mockResolvedValue([{ id: "sub_123", email: "s@example.com", status: "active" }]),
      filterSubscribersByAudience: jest.fn().mockImplementation((subs) => subs),
      updateEmailCampaigns: jest.fn().mockResolvedValue({ id: "camp_123", status: "sent" }),
      listEmailCampaignLogs: jest.fn().mockResolvedValue([]),
      createEmailCampaignLogs: jest.fn().mockResolvedValue([{ id: "log_123", subscriber_id: "sub_123", status: "queued" }]),
      updateEmailCampaignLogs: jest.fn().mockResolvedValue({}),
      buildOpenTrackingToken: EmailMarketingModuleService.prototype["buildOpenTrackingToken"],
      getTrackingBaseUrl: EmailMarketingModuleService.prototype["getTrackingBaseUrl"],
      sanitizeOrigin: EmailMarketingModuleService.prototype["sanitizeOrigin"],
      appendTrackingPixel: EmailMarketingModuleService.prototype["appendTrackingPixel"],
      getErrorMessage: EmailMarketingModuleService.prototype["getErrorMessage"],
      baseRepository_: { getFreshManager: () => ({}) },
    }

    await EmailMarketingModuleService.prototype.queueCampaignSend.call(
      service,
      "camp_123",
      { createNotifications },
      {},
      undefined
    )

    expect(createNotifications).toHaveBeenCalledTimes(1)
    const payload = createNotifications.mock.calls[0][0]
    expect(payload.data.open_tracking_url).toContain("https://backend.example.com/email-marketing/campaigns/open?t=")
    expect(payload.content.html).toContain(payload.data.open_tracking_url)
  })
})
