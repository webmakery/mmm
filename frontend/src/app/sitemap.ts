import type { MetadataRoute } from "next"

type StoreRegion = {
  countries?: { iso_2?: string | null }[]
}

type StoreBlogPost = {
  slug: string
  updated_at?: string | null
  publish_date?: string | null
}

const getSiteUrl = () => {
  const value = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:8000"

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  return `https://${value}`
}

const getBackendUrl = () => process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const backendUrl = getBackendUrl()

  try {
    const [regionsResponse, postsResponse] = await Promise.all([
      fetch(`${backendUrl}/store/regions`, { next: { revalidate: 3600 } }),
      fetch(`${backendUrl}/store/blog-posts?limit=200&offset=0`, { next: { revalidate: 300 } }),
    ])

    if (!regionsResponse.ok || !postsResponse.ok) {
      return []
    }

    const { regions } = (await regionsResponse.json()) as { regions: StoreRegion[] }
    const { posts } = (await postsResponse.json()) as { posts: StoreBlogPost[] }

    const countryCodes = Array.from(
      new Set(
        (regions || [])
          .flatMap((region) => region.countries || [])
          .map((country) => country?.iso_2?.toLowerCase())
          .filter((iso2): iso2 is string => Boolean(iso2))
      )
    )

    const entries: MetadataRoute.Sitemap = []
    const locales = countryCodes.length ? countryCodes : ["us"]

    for (const countryCode of locales) {
      entries.push({
        url: `${siteUrl}/${countryCode}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      })

      for (const post of posts || []) {
        entries.push({
          url: `${siteUrl}/${countryCode}/blog/${post.slug}`,
          lastModified: post.updated_at || post.publish_date || new Date().toISOString(),
          changeFrequency: "weekly",
          priority: 0.7,
        })
      }
    }

    return entries
  } catch {
    return []
  }
}
