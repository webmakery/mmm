"use server"

import { sdk } from "@lib/config"
import { revalidatePath } from "next/cache"
import { getAuthHeaders } from "./cookies"

export type ProductReview = {
  id: string
  title: string | null
  content: string
  rating: number
  first_name: string
  last_name: string
  status: "pending" | "approved" | "rejected"
  product_id: string
  customer_id?: string | null
  created_at: string
}

export type ProductReviewsResponse = {
  reviews: ProductReview[]
  count: number
  limit: number
  offset: number
  average_rating: number
}

export const getProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<ProductReviewsResponse> => {
  const offset = Math.max(page - 1, 0) * limit

  return sdk.client
    .fetch<ProductReviewsResponse>(`/store/products/${productId}/reviews`, {
      method: "GET",
      query: {
        limit,
        offset,
      },
      cache: "no-store",
    })
    .catch(() => ({
      reviews: [],
      count: 0,
      limit,
      offset,
      average_rating: 0,
    }))
}

export async function createReview(
  _currentState: { success: boolean; message: string | null },
  formData: FormData
): Promise<{ success: boolean; message: string | null }> {
  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!headers.authorization) {
    return {
      success: false,
      message: "Please sign in to submit a review.",
    }
  }

  const productId = formData.get("product_id") as string

  const payload = {
    title: (formData.get("title") as string) || undefined,
    content: formData.get("content") as string,
    rating: Number(formData.get("rating") as string),
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    product_id: productId,
  }

  try {
    await sdk.client.fetch("/store/reviews", {
      method: "POST",
      body: payload,
      headers,
      cache: "no-store",
    })

    revalidatePath("/[countryCode]/(main)/products/[handle]", "page")

    return {
      success: true,
      message: "Your review was submitted and is pending approval.",
    }
  } catch {
    return {
      success: false,
      message: "Could not submit your review. Please try again.",
    }
  }
}
