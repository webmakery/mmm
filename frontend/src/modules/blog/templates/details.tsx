import { BlogPost } from "@lib/data/blog"
import BlogCard from "@modules/blog/components/blog-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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

const BlogDetailsTemplate = ({ post, related_posts }: { post: BlogPost; related_posts: BlogPost[] }) => {
  return (
    <div className="content-container py-10 small:py-12" data-testid="blog-details-page">
      <article className="mx-auto max-w-3xl flex flex-col gap-y-6">
        <header className="flex flex-col gap-y-2">
          <p className="text-small-regular text-ui-fg-subtle">
            <LocalizedClientLink href="/blog">Blog</LocalizedClientLink> / {post.title}
          </p>
          <h1 className="text-2xl-semi">{post.title}</h1>
          <p className="text-small-regular text-ui-fg-subtle">
            {post.author_name || "Admin"}
            {post.publish_date ? ` • ${new Date(post.publish_date).toLocaleDateString()}` : ""}
          </p>
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.image_alt || post.title}
              className="w-full aspect-[16/9] object-cover rounded-rounded"
            />
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
                <BlogCard post={related} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export default BlogDetailsTemplate
