import { GET } from "../route"

describe("GET /store/email-marketing/campaigns/open", () => {
  it("applies open tracking token and returns tracking pixel", async () => {
    const applyOpenTrackingToken = jest.fn().mockResolvedValue({ updated: true, reason: "updated", subscriber_id: "sub_1", log_id: "log_1" })
    const getTransparentTrackingPixelBuffer = jest.fn().mockReturnValue(Buffer.from("gif"))
    const logger = { info: jest.fn(), warn: jest.fn() }

    const req: any = {
      validatedQuery: { t: "signed-token" },
      headers: { "user-agent": "jest-agent" },
      ip: "127.0.0.1",
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

    expect(applyOpenTrackingToken).toHaveBeenCalledWith("signed-token", expect.objectContaining({ ip: "127.0.0.1" }))
    expect(status).toHaveBeenCalledWith(200)
    expect(send).toHaveBeenCalledWith(Buffer.from("gif"))
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("open tracking route hit"))
  })

  it("logs skipped updates for invalid tokens", async () => {
    const applyOpenTrackingToken = jest.fn().mockResolvedValue({ updated: false, reason: "invalid_token" })
    const logger = { info: jest.fn(), warn: jest.fn() }

    const req: any = {
      validatedQuery: { t: "bad" },
      headers: {},
      ip: null,
      scope: {
        resolve: (key: string) =>
          key === "logger"
            ? logger
            : { applyOpenTrackingToken, getTransparentTrackingPixelBuffer: () => Buffer.from("gif") },
      },
    }

    const res: any = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), send: jest.fn() }

    await GET(req, res)

    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("reason=invalid_token"))
  })
})
