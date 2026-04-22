import { GET } from "../route"

describe("GET /email-marketing/campaigns/view", () => {
  it("returns tracked campaign html for valid browser-view tokens", async () => {
    const getCampaignBrowserViewHtmlByToken = jest.fn().mockResolvedValue({
      campaign_id: "camp_1",
      subscriber_id: "sub_1",
      html: "<html><body><p>Tracked email</p></body></html>",
    })
    const logger = { info: jest.fn(), warn: jest.fn() }

    const req: any = {
      validatedQuery: { t: "signed-token" },
      headers: { "user-agent": "Mozilla/5.0" },
      ip: "203.0.113.10",
      scope: {
        resolve: (key: string) =>
          key === "logger"
            ? logger
            : { getCampaignBrowserViewHtmlByToken },
      },
    }

    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() }

    await GET(req, res)

    expect(getCampaignBrowserViewHtmlByToken).toHaveBeenCalledWith("signed-token")
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.send).toHaveBeenCalledWith("<html><body><p>Tracked email</p></body></html>")
  })

  it("returns not found html for invalid browser-view tokens", async () => {
    const logger = { info: jest.fn(), warn: jest.fn() }
    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() }

    await GET(
      {
        validatedQuery: { t: "bad" },
        headers: {},
        ip: null,
        scope: {
          resolve: (key: string) =>
            key === "logger"
              ? logger
              : { getCampaignBrowserViewHtmlByToken: jest.fn().mockResolvedValue(null) },
        },
      } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(404)
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("reason=invalid_token"))
  })
})
