"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders } from "./cookies"

export async function requestQuoteForCart(cartId: string): Promise<{
  success: boolean
  message: string
}> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!headers.authorization) {
    return {
      success: false,
      message: "Please sign in to request a quote.",
    }
  }

  try {
    await sdk.client.fetch("/store/customers/me/quotes", {
      method: "POST",
      headers,
      body: {
        cart_id: cartId,
      },
      cache: "no-store",
    })

    return {
      success: true,
      message: "Quote request sent successfully.",
    }
  } catch (error) {
    return {
      success: false,
      message: "Could not request quote. Please try again.",
    }
  }
}
