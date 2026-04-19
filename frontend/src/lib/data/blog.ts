"use server"

import { sdk } from "@lib/config"

export type BlogCategory = {
  id: string
  name: string
  slug: string
}

export type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: { body?: string } | string | null
  featured_image?: string | null
  author_name?: string | null
  publish_date?: string | null
  seo_title?: string | null
  seo_description?: string | null
  categories?: BlogCategory[]
}

export const listBlogPosts = async ({
  page = 1,
  limit = 9,
  q,
  category,
}: {
  page?: number
  limit?: number
  q?: string
  category?: string
}) => {
  const offset = (Math.max(page, 1) - 1) * limit

  return sdk.client.fetch<{ posts: BlogPost[]; count: number }>("/store/blog-posts", {
    method: "GET",
    query: {
      limit,
      offset,
      ...(q ? { q } : {}),
      ...(category ? { category } : {}),
    },
    cache: "no-store",
  })
}

export const retrieveBlogPost = async (slug: string) => {
  return sdk.client.fetch<{ post: BlogPost; related_posts: BlogPost[] }>(`/store/blog-posts/${slug}`, {
    method: "GET",
    cache: "no-store",
  })
}

export const listBlogCategories = async () => {
  return sdk.client
    .fetch<{ categories: BlogCategory[] }>("/store/blog-categories", {
      method: "GET",
      cache: "force-cache",
    })
    .then(({ categories }) => categories)
    .catch(() => [])
}
