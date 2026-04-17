jest.mock("node:dns/promises", () => ({
  __esModule: true,
  default: {
    resolveCname: jest.fn(),
    resolve4: jest.fn(),
    resolve6: jest.fn(),
  },
}))

import dns from "node:dns/promises"
import { verifyDomainDns } from "../custom-domains/dns-verification"

const resolveCnameMock = (dns as any).resolveCname as jest.Mock
const resolve4Mock = (dns as any).resolve4 as jest.Mock
const resolve6Mock = (dns as any).resolve6 as jest.Mock

describe("verifyDomainDns", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("validates CNAME chains", async () => {
    resolveCnameMock
      .mockResolvedValueOnce(["cust123.ourplatform.com"])
      .mockRejectedValueOnce({ code: "ENODATA" })

    const result = await verifyDomainDns({
      domain: "shop.brand.com",
      verificationType: "cname",
      expectedValue: "cust123.ourplatform.com",
    })

    expect(result).toEqual({ isValid: true, reason: null })
  })

  it("validates A records", async () => {
    resolve4Mock.mockResolvedValueOnce(["203.0.113.10"])
    resolve6Mock.mockResolvedValueOnce([])

    const result = await verifyDomainDns({
      domain: "shop.brand.com",
      verificationType: "a_record",
      expectedValue: "203.0.113.10",
    })

    expect(result).toEqual({ isValid: true, reason: null })
  })
})
