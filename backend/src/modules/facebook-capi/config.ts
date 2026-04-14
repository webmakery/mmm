import { DEFAULT_API_VERSION } from "./constants"
import { FacebookCapiModuleOptions } from "./types"

type Logger = Pick<typeof console, "info" | "warn">

type SanitizedValue = {
  value?: string
  diagnostics: {
    exists: boolean
    length: number
    first6: string
    last6: string
    trimChanged: boolean
    lastCharCode: number | null
  }
}

const stripWrappingQuotes = (value: string) => {
  if (value.length >= 2) {
    const startsWithSingle = value.startsWith("'")
    const endsWithSingle = value.endsWith("'")
    const startsWithDouble = value.startsWith('"')
    const endsWithDouble = value.endsWith('"')

    if ((startsWithSingle && endsWithSingle) || (startsWithDouble && endsWithDouble)) {
      return value.slice(1, -1)
    }
  }

  return value
}

const sanitizeMetaEnvValue = (name: string, rawValue?: string): SanitizedValue => {
  if (!rawValue) {
    return {
      value: undefined,
      diagnostics: {
        exists: false,
        length: 0,
        first6: "",
        last6: "",
        trimChanged: false,
        lastCharCode: null,
      },
    }
  }

  const trimmed = rawValue.trim()
  const unquoted = stripWrappingQuotes(trimmed)
  const value = unquoted.trim()

  if (!value) {
    throw new Error(`[meta/config] ${name} is empty after sanitization`)
  }

  const hasWhitespace = /\s/.test(value)
  const hasControlChars = /[\r\n\t]/.test(value)
  const hasSuspiciousTrailingChar = /[>"']$/.test(value)

  if (hasWhitespace || hasControlChars || hasSuspiciousTrailingChar) {
    throw new Error(
      `[meta/config] ${name} contains suspicious formatting. Check deployment env value for extra characters.`
    )
  }

  return {
    value,
    diagnostics: {
      exists: true,
      length: value.length,
      first6: value.slice(0, 6),
      last6: value.slice(-6),
      trimChanged: rawValue !== value,
      lastCharCode: value.length > 0 ? value.charCodeAt(value.length - 1) : null,
    },
  }
}

const parseBoolean = (value?: string) => value === "true"
const parseNumber = (value?: string) => (value ? Number(value) : undefined)

// Keep Meta auth/config resolution separate from product-builder event shaping so
// builder payload changes cannot accidentally mutate CAPI credentials.
export const getMetaConfigFromEnv = (
  env: NodeJS.ProcessEnv = process.env,
  logger: Logger = console
): FacebookCapiModuleOptions => {
  const pixel = sanitizeMetaEnvValue(
    "META_PIXEL_ID",
    env.FACEBOOK_CAPI_PIXEL_ID || env.META_PIXEL_ID
  )
  const token = sanitizeMetaEnvValue(
    "META_CONVERSIONS_API_ACCESS_TOKEN",
    env.FACEBOOK_CAPI_ACCESS_TOKEN || env.META_CONVERSIONS_API_ACCESS_TOKEN
  )

  if (parseBoolean(env.FACEBOOK_CAPI_ENABLED) && (!pixel.value || !token.value)) {
    throw new Error(
      "[meta/config] FACEBOOK_CAPI_ENABLED is true but pixel id or access token is missing"
    )
  }

  logger.info("[meta/config] access token diagnostics", {
    exists: token.diagnostics.exists,
    length: token.diagnostics.length,
    first6: token.diagnostics.first6,
    last6: token.diagnostics.last6,
    trim_changed: token.diagnostics.trimChanged,
    last_char_code: token.diagnostics.lastCharCode,
  })

  return {
    enabled: parseBoolean(env.FACEBOOK_CAPI_ENABLED),
    pixelId: pixel.value,
    accessToken: token.value,
    testEventCode:
      env.META_TEST_EVENT_CODE ||
      env.FACEBOOK_CAPI_TEST_EVENT_CODE ||
      (env.NODE_ENV !== "production" ? "TEST35035" : undefined),
    apiVersion: env.FACEBOOK_CAPI_API_VERSION || DEFAULT_API_VERSION,
    timeoutMs: parseNumber(env.FACEBOOK_CAPI_TIMEOUT_MS),
    maxRetries: parseNumber(env.FACEBOOK_CAPI_MAX_RETRIES),
  }
}

export { sanitizeMetaEnvValue }
