import { retrieveBlogPost } from "@lib/data/blog"
import BlogDetailsTemplate from "@modules/blog/templates/details"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

type BlogPostPageProps = {
  params: Promise<{ countryCode: string; slug: string }>
}

const getSiteUrl = () => {
  const value = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:8000"

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value
  }

  return `https://${value}`
}

const getBodyContent = (content: unknown): string => {
  if (typeof content === "string") {
    return content
  }

  if (content && typeof content === "object" && "body" in (content as Record<string, unknown>)) {
    const body = (content as { body?: unknown }).body
    return typeof body === "string" ? body : ""
  }

  return ""
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const { countryCode, slug } = await props.params

  try {
    const { post } = await retrieveBlogPost(slug)
    const siteUrl = getSiteUrl()
    const routeUrl = `${siteUrl}/${countryCode}/blog/${post.slug}`
    const title = post.meta_title || post.seo_title || post.title
    const description =
      post.meta_description || post.seo_description || post.excerpt || getBodyContent(post.content).slice(0, 160)
    const canonical = post.canonical_url || routeUrl

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        type: "article",
        title,
        description,
        url: canonical,
        images: post.featured_image
          ? [
              {
                url: post.featured_image,
                alt: post.image_alt || post.title,
              },
            ]
          : [],
        publishedTime: post.publish_date || undefined,
        modifiedTime: post.updated_at || undefined,
      },
      twitter: {
        card: post.featured_image ? "summary_large_image" : "summary",
        title,
        description,
        images: post.featured_image ? [post.featured_image] : undefined,
      },
    }
  } catch {
    return {
      title: "Blog post",
      description: "Blog post details",
      robots: {
        index: false,
        follow: false,
      },
    }
  }
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { countryCode, slug } = await props.params

  try {
    const { post, related_posts } = await retrieveBlogPost(slug)
    const siteUrl = getSiteUrl()
    const routeUrl = `${siteUrl}/${countryCode}/blog/${post.slug}`
    const description =
      post.meta_description || post.seo_description || post.excerpt || getBodyContent(post.content).slice(0, 160)

    const articleJsonLd = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title,
      description,
      image: post.featured_image ? [post.featured_image] : undefined,
      author: {
        "@type": "Person",
        name: post.author_name || "Admin",
      },
      datePublished: post.publish_date || undefined,
      dateModified: post.updated_at || post.publish_date || undefined,
      mainEntityOfPage: post.canonical_url || routeUrl,
    }

    return (
      <>
        <BlogDetailsTemplate post={post} related_posts={related_posts} />
        {post.status === "published" ? (
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
        ) : null}
      </>
    )
  } catch {
    notFound()
  }
}
