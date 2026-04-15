"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

export type StoreSubscriptionPlan = {
  id: string
  name: string
  stripe_product_id: string
  stripe_price_id: string
  interval: "monthly" | "yearly"
  active: boolean
  metadata?: Record<string, unknown> | null
}

export const listSubscriptionPlans = async () => {
  return sdk.client
    .fetch<{ subscription_plans: StoreSubscriptionPlan[] }>(
      "/store/subscription-plans",
      {
        method: "GET",
        cache: "no-cache",
      }
    )
    .then(({ subscription_plans }) => subscription_plans)
    .catch((err) => medusaError(err))
}

export const requestPlanCheckoutUrl = async (planId: string) => {
  const authHeaders = await getAuthHeaders()
  const requestHeaders =
    Object.keys(authHeaders).length > 0 ? authHeaders : undefined

  return sdk.client
    .fetch<{ url: string }>(
      `/store/subscription-plans/${planId}/checkout-session`,
      {
        method: "POST",
        headers: requestHeaders,
      }
    )
    .then(({ url }) => url)
    .catch((err) => medusaError(err))
}

export const subscribeToPlan = async (formData: FormData) => {
  const planId = formData.get("plan_id")

  if (!planId || typeof planId !== "string") {
    return
  }

  try {
    const url = await requestPlanCheckoutUrl(planId)
    redirect(url)
  } catch {
    const requestHeaders = await headers()
    const referer = requestHeaders.get("referer")
    const fallbackPath = "/plans?checkout_error=1"

    if (!referer) {
      redirect(fallbackPath)
    }

    try {
      const refererUrl = new URL(referer)
      refererUrl.searchParams.set("checkout_error", "1")
      redirect(`${refererUrl.pathname}${refererUrl.search}`)
    } catch {
      redirect(fallbackPath)
    }
  }
}
