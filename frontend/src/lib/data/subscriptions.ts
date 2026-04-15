"use server"

import { getCacheOptions } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { redirect } from "next/navigation"
import {
  getAuthenticatedStoreClient,
  getPublicStoreClient,
} from "./medusa-store-client"

export type CustomerSubscription = {
  id: string
  status: string
  interval?: string | null
  period?: number | null
  subscription_date?: string | null
  last_order_date?: string | null
  next_order_date?: string | null
  expiration_date?: string | null
  metadata?: Record<string, unknown> | null
}

export const getCustomerSubscriptions = async () => {
  const authenticatedClient = await getAuthenticatedStoreClient()

  if (!authenticatedClient) {
    return []
  }

  const next = {
    ...(await getCacheOptions("subscriptions")),
  }

  return authenticatedClient.client
    .fetch<{ subscriptions: CustomerSubscription[] }>(
      "/store/customers/me/subscriptions",
      {
        method: "GET",
        headers: authenticatedClient.headers,
        next,
        cache: "no-cache",
      }
    )
    .then(({ subscriptions }) => subscriptions)
    .catch((err) => medusaError(err))
}

export const requestSubscriptionPortalUrl = async () => {
  const authenticatedClient = await getAuthenticatedStoreClient()

  if (!authenticatedClient) {
    throw new Error("Authentication required")
  }

  return authenticatedClient.client
    .fetch<{ url: string }>("/store/customers/me/subscriptions/portal", {
      method: "POST",
      headers: authenticatedClient.headers,
    })
    .then(({ url }) => url)
    .catch((err) => medusaError(err))
}

export const manageSubscription = async () => {
  const url = await requestSubscriptionPortalUrl()

  redirect(url)
}

export const syncSubscriptionFromCheckoutSession = async (sessionId: string) => {
  const authenticatedClient = await getAuthenticatedStoreClient()

  if (authenticatedClient) {
    return authenticatedClient.client
      .fetch<{ subscription: CustomerSubscription }>(
        "/store/subscriptions/sync",
        {
          method: "POST",
          headers: authenticatedClient.headers,
          body: {
            session_id: sessionId,
          },
        }
      )
      .catch((err) => medusaError(err))
  }

  return getPublicStoreClient()
    .fetch<{ subscription: CustomerSubscription }>(
      "/store/subscriptions/sync",
      {
        method: "POST",
        body: {
          session_id: sessionId,
        },
      }
    )
    .catch((err) => medusaError(err))
}
