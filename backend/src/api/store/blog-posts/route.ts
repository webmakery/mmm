import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

export const GetStoreBlogPostsSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(9),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetStoreBlogPostsSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const query = req.validatedQuery as z.infer<typeof GetStoreBlogPostsSchema>

  const result = await blogService.listStorePublishedPosts(
    {
      q: query.q,
      category: query.category,
    },
    {
      limit: query.limit,
      offset: query.offset,
    }
  )

  res.json({
    posts: result.posts.map((post) => ({
      ...post,
      meta_title: (post as Record<string, unknown>).seo_title || null,
      meta_description: (post as Record<string, unknown>).seo_description || null,
    })),
    count: result.count,
    limit: query.limit,
    offset: query.offset,
  })
}
