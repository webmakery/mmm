import { getLocaleHeader } from "@lib/util/get-locale-header"
import Medusa, { FetchArgs, FetchInput } from "@medusajs/js-sdk"

// Defaults to standard port for Medusa server
let MEDUSA_BACKEND_URL = "http://localhost:9000"

if (process.env.MEDUSA_BACKEND_URL) {
  MEDUSA_BACKEND_URL = process.env.MEDUSA_BACKEND_URL
}

const createBaseMedusaClient = () =>
  new Medusa({
    baseUrl: MEDUSA_BACKEND_URL,
    debug: process.env.NODE_ENV === "development",
    publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  })

const withLocaleHeader = <T extends Medusa>(client: T): T => {
  const originalFetch = client.client.fetch.bind(client.client)

  client.client.fetch = async <R>(
    input: FetchInput,
    init?: FetchArgs
  ): Promise<R> => {
    const headers = init?.headers ?? {}
    let localeHeader: Record<string, string | null> | undefined

    try {
      localeHeader = await getLocaleHeader()
      headers["x-medusa-locale"] ??= localeHeader["x-medusa-locale"]
    } catch {}

    return originalFetch(input, {
      ...init,
      headers: {
        ...localeHeader,
        ...headers,
      },
    })
  }

  return client
}

/**
 * Public store client (publishable API key only).
 * Never attach customer auth headers here by default.
 */
export const publicSdk = withLocaleHeader(createBaseMedusaClient())

/**
 * Authenticated client factory (publishable API key + optional bearer token).
 * We intentionally create a fresh instance per request to avoid cross-request
 * header leakage from mutable SDK auth state.
 */
export const createAuthenticatedSdk = () => withLocaleHeader(createBaseMedusaClient())

// Backwards-compatible alias used by existing data modules.
export const sdk = publicSdk
