import { buildHetznerLabels, sanitizeHetznerLabelSegment } from "../provision-hetzner-server"

describe("provision hetzner labels", () => {
  it("sanitizes unsupported characters and trims boundaries", () => {
    expect(sanitizeHetznerLabelSegment("n/a", "na")).toBe("n-a")
    expect(sanitizeHetznerLabelSegment("---ABC///", "na")).toBe("abc")
    expect(sanitizeHetznerLabelSegment("___", "fallback")).toBe("fallback")
  })

  it("builds labels safe for hetzner api", () => {
    expect(
      buildHetznerLabels({
        order_id: null,
        stripe_subscription_id: "sub_01KPANMNWGZPWJ9Q1YHYFJSCP8",
        customer_id: "cust-cus-01kp9k6m4e5e2zsv3qq9bnzqq9",
      })
    ).toEqual({
      managed_by: "medusa",
      order_id: "na",
      subscription_id: "sub_01kpanmnwgzpwj9q1yhyfjscp8",
      customer_id: "cust-cus-01kp9k6m4e5e2zsv3qq9bnzqq9",
    })
  })
})
