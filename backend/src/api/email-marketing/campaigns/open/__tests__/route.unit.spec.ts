import { GET } from "../route"

describe("GET /email-marketing/campaigns/open", () => {
  it("applies open tracking token and returns tracking pixel without requiring store headers", async () => {
    const applyOpenTrackingToken = jest.fn().mockResolvedValue({ updated: true, reason: "updated", subscriber_id: "sub_1", log_id: "log_1" })
    const getTransparentTrackingPixelBuffer = jest.fn().mockReturnValue(Buffer.from("gif"))
    const logger = { info: jest.fn(), warn: jest.fn() }

    const req: any = {
      validatedQuery: { t: "signed-token" },
      headers: { "user-agent": "google-image-proxy" },
      ip: "203.0.113.9",
      scope: {
        resolve: (key: string) => {
          if (key === "logger") {
            return logger
          }

          return {
            applyOpenTrackingToken,
            getTransparentTrackingPixelBuffer,
          }
        },
      },
    }

    const setHeader = jest.fn()
    const status = jest.fn().mockReturnThis()
    const send = jest.fn()
    const res: any = { setHeader, status, send }

    await GET(req, res)

    expect(applyOpenTrackingToken).toHaveBeenCalledWith("signed-token", expect.objectContaining({ ip: "203.0.113.9" }))
    expect(status).toHaveBeenCalledWith(200)
    expect(send).toHaveBeenCalledWith(Buffer.from("gif"))
  })

  it("returns pixel but skips analytics updates for invalid tokens", async () => {
    const applyOpenTrackingToken = jest.fn().mockResolvedValue({ updated: false, reason: "invalid_token" })
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
              : { applyOpenTrackingToken, getTransparentTrackingPixelBuffer: () => Buffer.from("gif") },
        },
      } as any,
      res
    )

    expect(res.status).toHaveBeenCalledWith(200)
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("reason=invalid_token"))
  })
})
