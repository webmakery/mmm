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

  it("applies opened event when token is valid", async () => {
    const applyOpenTrackingToken = EmailMarketingModuleService.prototype.applyOpenTrackingToken

    const service = {
      decodeOpenTrackingToken: jest
        .fn()
        .mockReturnValue({ campaign_id: "campaign_123", subscriber_id: "subscriber_123" }),
      applyCampaignDeliveryEvent: jest.fn().mockResolvedValue({ updated: true, reason: "updated" }),
    }

    const result = await applyOpenTrackingToken.call(service, "signed.token", { user_agent: "jest" })

    expect(service.applyCampaignDeliveryEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        campaign_id: "campaign_123",
        subscriber_id: "subscriber_123",
        status: "opened",
      }),
      undefined
    )
    expect(result).toEqual({ updated: true, reason: "updated" })
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
})
