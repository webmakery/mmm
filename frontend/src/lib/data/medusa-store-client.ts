import "server-only"

import { createAuthenticatedSdk, publicSdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"

const hasValidCustomerSession = async (authorization: string) => {
  try {
    await publicSdk.client.fetch<{ customer: { id: string } }>(
      "/store/customers/me",
      {
        method: "GET",
        headers: {
          authorization,
        },
        query: {
          fields: "id",
        },
        cache: "no-cache",
      }
    )

    return true
  } catch {
    return false
  }
}

export const getPublicStoreClient = () => publicSdk.client

export const getAuthenticatedStoreClient = async () => {
  const authHeaders = await getAuthHeaders()

  if (!("authorization" in authHeaders) || !authHeaders.authorization) {
    return null
  }

  const isValidSession = await hasValidCustomerSession(authHeaders.authorization)

  if (!isValidSession) {
    return null
  }

  return {
    client: createAuthenticatedSdk().client,
    headers: authHeaders,
  }
}
