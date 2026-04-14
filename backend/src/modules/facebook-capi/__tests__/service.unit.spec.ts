import FacebookCapiModuleService from "../service"

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe("facebook capi service", () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it("does not send duplicate events", async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200, text: async () => "ok" })
    // @ts-expect-error test mock
    global.fetch = fetchMock

    const service = new FacebookCapiModuleService(
      { logger },
      { enabled: true, pixelId: "pixel", accessToken: "token", maxRetries: 0 }
    )

    const payload = {
      id: "order_1",
      event_id: "evt_same",
      created_at: "2026-01-01T00:00:00.000Z",
      currency_code: "usd",
    }

    await service.track("purchase", payload)
    await service.track("purchase", payload)

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("retries on retryable facebook response", async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => "server error" })
      .mockResolvedValueOnce({ ok: true, status: 200, text: async () => "ok" })
    // @ts-expect-error test mock
    global.fetch = fetchMock

    const service = new FacebookCapiModuleService(
      { logger },
      { enabled: true, pixelId: "pixel", accessToken: "token", maxRetries: 1 }
    )

    await service.track("initiate_checkout", {
      id: "cart_1",
      created_at: "2026-01-01T00:00:00.000Z",
      currency_code: "usd",
    })

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
