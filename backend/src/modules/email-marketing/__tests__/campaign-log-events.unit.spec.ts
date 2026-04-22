import EmailMarketingModuleService from "../service"

describe("EmailMarketingModuleService delivery status transitions", () => {
  it("promotes to more detailed statuses and blocks downgrades", () => {
    const service = {
      statusPriority: {
        queued: 0,
        failed: 1,
        sent: 2,
        delivered: 3,
        opened: 4,
        clicked: 5,
      },
    }

    const shouldPromoteStatus = EmailMarketingModuleService.prototype["shouldPromoteStatus"].bind(service)

    expect(shouldPromoteStatus("sent", "delivered")).toBe(true)
    expect(shouldPromoteStatus("delivered", "opened")).toBe(true)
    expect(shouldPromoteStatus("opened", "sent")).toBe(false)
    expect(shouldPromoteStatus("clicked", "opened")).toBe(false)
  })

  it("allows failed events only before engagement states", () => {
    const service = {
      statusPriority: {
        queued: 0,
        failed: 1,
        sent: 2,
        delivered: 3,
        opened: 4,
        clicked: 5,
      },
    }

    const shouldPromoteStatus = EmailMarketingModuleService.prototype["shouldPromoteStatus"].bind(service)

    expect(shouldPromoteStatus("queued", "failed")).toBe(true)
    expect(shouldPromoteStatus("sent", "failed")).toBe(true)
    expect(shouldPromoteStatus("opened", "failed")).toBe(false)
    expect(shouldPromoteStatus("failed", "delivered")).toBe(true)
  })
})
