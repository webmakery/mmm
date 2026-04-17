import { normalizeDomain } from "../custom-domains/domain-validation"

describe("normalizeDomain", () => {
  it("normalizes valid domains", () => {
    expect(normalizeDomain("  Shop.Brand.com ")).toBe("shop.brand.com")
  })

  it("rejects scheme, wildcard, and paths", () => {
    expect(() => normalizeDomain("https://shop.brand.com")).toThrow("Do not include protocol prefixes")
    expect(() => normalizeDomain("*.brand.com")).toThrow("Wildcard domains are not allowed")
    expect(() => normalizeDomain("shop.brand.com/path")).toThrow("Do not include paths or query strings")
  })

  it("rejects localhost and internal hostnames", () => {
    expect(() => normalizeDomain("localhost")).toThrow("Domain must be a valid FQDN")
    expect(() => normalizeDomain("shop.internal.com")).toThrow("Reserved or internal hostnames are not allowed")
  })
})
