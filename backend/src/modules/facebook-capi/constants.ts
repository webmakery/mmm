export const FACEBOOK_CAPI_MODULE = "facebook_capi"

export const DEFAULT_API_VERSION = "v20.0"
export const DEFAULT_TIMEOUT_MS = 5_000
export const DEFAULT_MAX_RETRIES = 2
export const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
