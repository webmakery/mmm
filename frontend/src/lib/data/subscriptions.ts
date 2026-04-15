"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { redirect } from "next/navigation"

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
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("subscriptions")),
  }

  return sdk.client
    .fetch<{ subscriptions: CustomerSubscription[] }>(
      "/store/customers/me/subscriptions",
      {
        method: "GET",
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ subscriptions }) => subscriptions)
    .catch((err) => medusaError(err))
}

export const requestSubscriptionPortalUrl = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ url: string }>("/store/customers/me/subscriptions/portal", {
      method: "POST",
      headers,
    })
    .then(({ url }) => url)
    .catch((err) => medusaError(err))
}

export const manageSubscription = async () => {
  const url = await requestSubscriptionPortalUrl()

  redirect(url)
}
