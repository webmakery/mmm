import { isRetryableError } from "../errors"

describe("isRetryableError", () => {
  it("treats missing database column errors as non-retryable", () => {
    expect(
      isRetryableError(new Error('column "website" of relation "lead" does not exist'))
    ).toBe(false)

    expect(
      isRetryableError(new Error('column "google_maps_uri" of relation "lead" does not exist'))
    ).toBe(false)
  })

  it("treats transient upstream errors as retryable", () => {
    expect(isRetryableError(Object.assign(new Error("temporary upstream failure"), { statusCode: 503 }))).toBe(true)
  })
})
