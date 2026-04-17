"use server"

import { sdk } from "@lib/config"

export type StoreBranding = {
  store_name: string
  store_logo_url: string | null
}

const fallbackBranding: StoreBranding = {
  store_name: "Store",
  store_logo_url: null,
}

export const getStoreBranding = async (): Promise<StoreBranding> => {
  return sdk.client
    .fetch<StoreBranding>("/store/branding", {
      method: "GET",
      cache: "no-store",
    })
    .catch(() => fallbackBranding)
}
