const NON_RETRYABLE_ERROR_CODES = new Set(["INVALID_DATA", "VALIDATION_ERROR", "NON_RETRYABLE"])

export class LeadAgentInputError extends Error {
  readonly code = "NON_RETRYABLE"
}

export const isRetryableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") {
    return true
  }

  const maybeError = error as {
    code?: string
    name?: string
    status?: number
    statusCode?: number
    cause?: unknown
  }

  if (
    (typeof maybeError.code === "string" && NON_RETRYABLE_ERROR_CODES.has(maybeError.code)) ||
    maybeError.name === "ZodError" ||
    maybeError.name === "TypeError"
  ) {
    return false
  }

  const statusCode = typeof maybeError.statusCode === "number" ? maybeError.statusCode : maybeError.status
  if (typeof statusCode === "number") {
    return statusCode >= 500 || statusCode === 429
  }

  if (maybeError.cause && !isRetryableError(maybeError.cause)) {
    return false
  }

  return true
}
