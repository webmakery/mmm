"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "@lib/data/cookies"
import medusaError from "@lib/util/medusa-error"

type DigitalProductMedia = {
  id: string
  fileName?: string | null
}

export type CustomerDigitalProduct = {
  id: string
  title?: string | null
  medias?: DigitalProductMedia[]
}

export const getCustomerDigitalProducts = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("digital-products")),
  }

  return sdk.client
    .fetch<{ digital_products: CustomerDigitalProduct[] }>(
      "/store/customers/me/digital-products",
      {
        method: "GET",
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ digital_products }) => digital_products)
    .catch((err) => medusaError(err))
}

export const getDigitalMediaDownloadLink = async (mediaId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ url: string }>(
      `/store/customers/me/digital-products/${mediaId}/download`,
      {
        method: "POST",
        headers,
      }
    )
    .then(({ url }) => url)
    .catch((err) => medusaError(err))
}
