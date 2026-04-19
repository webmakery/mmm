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
  content?: unknown
  featured_image?: string | null
  image_alt?: string | null
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  status: "draft" | "published"
  publish_date?: string | null
  categories?: BlogCategory[]
}

export type BlogPostFormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  image_alt: string
  seo_title: string
  seo_description: string
  canonical_url: string
  status: "draft" | "published"
  category_ids: string[]
}

export const emptyFormState: BlogPostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  image_alt: "",
  seo_title: "",
  seo_description: "",
  canonical_url: "",
  status: "draft",
  category_ids: [],
}

export const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

export const getFormStateFromPost = (post: BlogPost): BlogPostFormState => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt || "",
  content: typeof post.content === "string" ? post.content : post.content ? JSON.stringify(post.content, null, 2) : "",
  featured_image: post.featured_image || "",
  image_alt: post.image_alt || "",
  seo_title: post.seo_title || "",
  seo_description: post.seo_description || "",
  canonical_url: post.canonical_url || "",
  status: post.status,
  category_ids: post.categories?.map((category) => category.id) || [],
})
