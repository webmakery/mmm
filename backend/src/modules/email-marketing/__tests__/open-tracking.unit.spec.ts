import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService open tracking", () => {
  const jwtSecret = process.env.JWT_SECRET

  beforeEach(() => {
    process.env.JWT_SECRET = "unit-test-secret"
  })

  afterEach(() => {
    if (jwtSecret === undefined) {
      delete process.env.JWT_SECRET
      return
    }

    process.env.JWT_SECRET = jwtSecret
  })

  it("builds and validates a signed open tracking token", () => {
    const buildOpenTrackingToken = EmailMarketingModuleService.prototype["buildOpenTrackingToken"]
    const decodeOpenTrackingToken = EmailMarketingModuleService.prototype["decodeOpenTrackingToken"]

    const token = buildOpenTrackingToken.call({}, "campaign_123", "subscriber_123")

    expect(decodeOpenTrackingToken.call({}, token)).toEqual({
      campaign_id: "campaign_123",
      subscriber_id: "subscriber_123",
    })

    expect(decodeOpenTrackingToken.call({}, `${token}tampered`)).toBeNull()
  })

  it("appends tracking pixel to html body", () => {
    const appendTrackingPixel = EmailMarketingModuleService.prototype["appendTrackingPixel"]
    const trackedHtml = appendTrackingPixel.call(
      {},
      "<html><body><p>Hello</p></body></html>",
      "https://example.com/store/email-marketing/campaigns/open?t=abc"
    )

    expect(trackedHtml).toContain('src="https://example.com/store/email-marketing/campaigns/open?t=abc"')
    expect(trackedHtml).toContain("</body>")
  })

  it("detects known machine-open proxy user agents", () => {
    const detectMachineOpenReason = EmailMarketingModuleService.prototype["detectMachineOpenReason"]
    const normalizeTrackingUserAgent = EmailMarketingModuleService.prototype["normalizeTrackingUserAgent"]

    expect(
      detectMachineOpenReason.call(
        { normalizeTrackingUserAgent },
        { user_agent: "Brevo/1.0 (redirection-images 1.88.33; +https://brevo.com)" }
      )
    ).toBe("brevo_image_proxy")

    expect(detectMachineOpenReason.call({ normalizeTrackingUserAgent }, { user_agent: "Mozilla/5.0" })).toBeNull()
  })

  it("applies opened event when token is valid and not classified as machine traffic", async () => {
    const applyOpenTrackingToken = EmailMarketingModuleService.prototype.applyOpenTrackingToken

    const service = {
      decodeOpenTrackingToken: jest
        .fn()
        .mockReturnValue({ campaign_id: "campaign_123", subscriber_id: "subscriber_123" }),
      detectMachineOpenReason: jest.fn().mockReturnValue(null),
      applyCampaignDeliveryEvent: jest.fn().mockResolvedValue({ updated: true, reason: "updated" }),
    }

    const result = await applyOpenTrackingToken.call(service, "signed.token", { user_agent: "Mozilla/5.0" })

    expect(service.applyCampaignDeliveryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        campaign_id: "campaign_123",
        subscriber_id: "subscriber_123",
        status: "opened",
        metadata: expect.objectContaining({
          tracking_source: "pixel",
          tracking_classification: "human",
          user_agent: "Mozilla/5.0",
        }),
      }),
      undefined
    )
    expect(result).toEqual({ updated: true, reason: "updated" })
  })

  it("suppresses machine opens from known proxy user agents", async () => {
    const applyOpenTrackingToken = EmailMarketingModuleService.prototype.applyOpenTrackingToken

    const service = {
      decodeOpenTrackingToken: jest
        .fn()
        .mockReturnValue({ campaign_id: "campaign_123", subscriber_id: "subscriber_123" }),
      detectMachineOpenReason: jest.fn().mockReturnValue("brevo_image_proxy"),
      applyCampaignDeliveryEvent: jest.fn(),
    }

    const result = await applyOpenTrackingToken.call(service, "signed.token", {
      user_agent: "Brevo/1.0 (redirection-images 1.88.33; +https://brevo.com)",
    })

    expect(service.applyCampaignDeliveryEvent).not.toHaveBeenCalled()
    expect(result).toEqual({
      updated: false,
      reason: "machine_open_detected",
      subscriber_id: "subscriber_123",
      machine_open_reason: "brevo_image_proxy",
    })
  })

  it("skips tracking update when token is invalid", async () => {
    const applyOpenTrackingToken = EmailMarketingModuleService.prototype.applyOpenTrackingToken

    const service = {
      decodeOpenTrackingToken: jest.fn().mockReturnValue(null),
      applyCampaignDeliveryEvent: jest.fn(),
    }

    const result = await applyOpenTrackingToken.call(service, "invalid", null)

    expect(service.applyCampaignDeliveryEvent).not.toHaveBeenCalled()
    expect(result).toEqual({ updated: false, reason: "invalid_token" })
  })

  it("falls back to provider_message_id log lookup and promotes to opened", async () => {
    const applyCampaignDeliveryEvent = EmailMarketingModuleService.prototype.applyCampaignDeliveryEvent

    const service = {
      listSubscribers: jest.fn().mockResolvedValue([]),
      listEmailCampaignLogs: jest
        .fn()
        .mockResolvedValueOnce([
          {
            id: "log_123",
            subscriber_id: "subscriber_123",
            status: "sent",
            provider_message_id: "msg_123",
            metadata: null,
            delivered_at: null,
            opened_at: null,
            clicked_at: null,
          },
        ]),
      shouldPromoteStatus: EmailMarketingModuleService.prototype["shouldPromoteStatus"],
      statusPriority: {
        queued: 0,
        failed: 1,
        sent: 2,
        delivered: 3,
        opened: 4,
        clicked: 5,
      },
      updateEmailCampaignLogs: jest.fn().mockResolvedValue({}),
      baseRepository_: { getFreshManager: () => ({}) },
    }

    const result = await applyCampaignDeliveryEvent.call(
      service,
      {
        campaign_id: "campaign_123",
        provider_message_id: "msg_123",
        status: "opened",
      },
      undefined
    )

    expect(service.listEmailCampaignLogs).toHaveBeenNthCalledWith(
      1,
      { campaign_id: "campaign_123", provider_message_id: "msg_123" },
      { take: 1 },
      expect.anything()
    )
    expect(service.updateEmailCampaignLogs).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "log_123",
        status: "opened",
        provider_message_id: "msg_123",
      }),
      expect.anything()
    )
    expect(result).toEqual(expect.objectContaining({ updated: true, subscriber_id: "subscriber_123", log_id: "log_123" }))
  })
})
