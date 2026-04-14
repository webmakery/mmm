import { getMetaConfigFromEnv, sanitizeMetaEnvValue } from "../config"

describe("facebook capi config", () => {
  it("sanitizes wrapped and padded token values", () => {
    const sanitized = sanitizeMetaEnvValue(
      "META_CONVERSIONS_API_ACCESS_TOKEN",
      '  "EAAB123456"  '
    )

    expect(sanitized.value).toBe("EAAB123456")
    expect(sanitized.diagnostics.trimChanged).toBe(true)
  })

  it("throws when token has suspicious trailing characters", () => {
    expect(() =>
      sanitizeMetaEnvValue("META_CONVERSIONS_API_ACCESS_TOKEN", "EAAB123456>")
    ).toThrow("contains suspicious formatting")
  })

  it("supports META_* fallback env vars", () => {
    const config = getMetaConfigFromEnv(
      {
        FACEBOOK_CAPI_ENABLED: "true",
        META_PIXEL_ID: "123456",
        META_CONVERSIONS_API_ACCESS_TOKEN: "EAAB_TOKEN",
      },
      { info: jest.fn(), warn: jest.fn() }
    )

    expect(config.pixelId).toBe("123456")
    expect(config.accessToken).toBe("EAAB_TOKEN")
  })
})
