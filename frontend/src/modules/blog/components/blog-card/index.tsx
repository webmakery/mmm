import LocalizedClientLink from "@modules/common/components/localized-client-link"

type BlogCardProps = {
  post: {
    slug: string
    title: string
    excerpt?: string | null
    featured_image?: string | null
    author_name?: string | null
    publish_date?: string | null
  }
}

const BlogCard = ({ post }: BlogCardProps) => {
  return (
    <LocalizedClientLink href={`/blog/${post.slug}`} className="group block">
      <article className="flex flex-col gap-y-3" data-testid="blog-card">
        {post.featured_image ? (
          <img
            src={post.featured_image}
            alt={post.title}
            className="w-full aspect-[16/10] object-cover rounded-rounded"
            loading="lazy"
          />
        ) : null}
        <div className="flex flex-col gap-y-2">
          <h3 className="text-large-semi group-hover:text-ui-fg-subtle">{post.title}</h3>
          <p className="text-small-regular text-ui-fg-subtle line-clamp-3">{post.excerpt || "Read more"}</p>
          <p className="text-small-regular text-ui-fg-muted">
            {post.author_name || "Admin"}
            {post.publish_date ? ` • ${new Date(post.publish_date).toLocaleDateString()}` : ""}
          </p>
        </div>
      </article>
    </LocalizedClientLink>
  )
}

export default BlogCard
