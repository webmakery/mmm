import { listBlogCategories, listBlogPosts } from "@lib/data/blog"
import BlogCard from "@modules/blog/components/blog-card"
import BlogFilters from "@modules/blog/components/blog-filters"
import { Pagination } from "@modules/store/components/pagination"

const BLOG_PAGE_LIMIT = 9

type BlogTemplateProps = {
  page?: string
  q?: string
  category?: string
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
                <BlogCard post={post} />
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
