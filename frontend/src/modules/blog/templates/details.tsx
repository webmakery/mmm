import { retrieveBlogPost } from "@lib/data/blog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Thumbnail from "@modules/products/components/thumbnail"
import { Text } from "@medusajs/ui"

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

type BlogPostData = Awaited<ReturnType<typeof retrieveBlogPost>>

const BlogPostPreview = ({ post }: { post: BlogPostData["post"] }) => {
  return (
    <LocalizedClientLink href={`/blog/${post.slug}`} className="group">
      <div data-testid="blog-card">
        <Thumbnail thumbnail={post.featured_image} size="full" />
        <div className="flex txt-compact-medium mt-4 justify-between gap-x-4">
          <Text className="text-ui-fg-subtle" data-testid="blog-title">
            {post.title}
          </Text>
          <Text className="text-ui-fg-muted">
            {post.publish_date ? new Date(post.publish_date).toLocaleDateString() : ""}
          </Text>
        </div>
      </div>
    </LocalizedClientLink>
  )
}

const BlogDetailsTemplate = async ({
  slug,
  blogPostData,
}: {
  slug: string
  blogPostData?: BlogPostData
}) => {
  const { post, related_posts } = blogPostData ?? (await retrieveBlogPost(slug))

  return (
    <div className="content-container py-10 small:py-12" data-testid="blog-details-page">
      <article className="mx-auto max-w-3xl flex flex-col gap-y-6">
        <header className="flex flex-col gap-y-2">
          <h1 className="text-2xl-semi">{post.title}</h1>
          <p className="text-small-regular text-ui-fg-subtle">
            {post.author_name || "Admin"}
            {post.publish_date ? ` • ${new Date(post.publish_date).toLocaleDateString()}` : ""}
          </p>
          {post.featured_image ? (
            <img src={post.featured_image} alt={post.title} className="w-full aspect-[16/9] object-cover rounded-rounded" />
          ) : null}
        </header>

        <div className="text-base-regular text-ui-fg-base whitespace-pre-line">
          {getBodyContent(post.content) || post.excerpt || ""}
        </div>
      </article>

      {related_posts.length ? (
        <section className="mt-12">
          <h2 className="text-large-semi mb-4">Related posts</h2>
          <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6">
            {related_posts.map((related) => (
              <li key={related.id}>
                <BlogPostPreview post={related} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export default BlogDetailsTemplate
