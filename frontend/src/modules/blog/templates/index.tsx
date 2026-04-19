import { listBlogCategories, listBlogPosts } from "@lib/data/blog"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import BlogFilters from "@modules/blog/components/blog-filters"
import Thumbnail from "@modules/products/components/thumbnail"
import { Pagination } from "@modules/store/components/pagination"
import { Text } from "@medusajs/ui"

const BLOG_PAGE_LIMIT = 9

type BlogTemplateProps = {
  page?: string
  q?: string
  category?: string
}

type BlogPostListItem = Awaited<ReturnType<typeof listBlogPosts>>["posts"][number]

const BlogPostPreview = ({ post }: { post: BlogPostListItem }) => {
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

const BlogTemplate = async ({ page, q, category }: BlogTemplateProps) => {
  const currentPage = Math.max(1, Number(page || "1"))

  const [{ posts, count }, categories] = await Promise.all([
    listBlogPosts({
      page: currentPage,
      limit: BLOG_PAGE_LIMIT,
      q,
      category,
    }),
    listBlogCategories(),
  ])

  const totalPages = Math.ceil(count / BLOG_PAGE_LIMIT)

  return (
    <div className="content-container py-10 small:py-12" data-testid="blog-listing-page">
      <div className="mb-8">
        <h1 className="text-2xl-semi">Blog</h1>
      </div>

      <BlogFilters categories={categories} />

      {posts.length ? (
        <>
          <ul className="grid grid-cols-1 small:grid-cols-2 medium:grid-cols-3 gap-6" data-testid="blog-list">
            {posts.map((post) => (
              <li key={post.id}>
                <BlogPostPreview post={post} />
              </li>
            ))}
          </ul>

          {totalPages > 1 ? <Pagination page={currentPage} totalPages={totalPages} data-testid="blog-pagination" /> : null}
        </>
      ) : (
        <p className="text-base-regular text-ui-fg-subtle">No blog posts found.</p>
      )}
    </div>
  )
}

export default BlogTemplate
