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

  const result = await blogService.listStorePublishedPosts(
    {
      q: req.validatedQuery.q,
      category: req.validatedQuery.category,
    },
    {
      limit: req.validatedQuery.limit,
      offset: req.validatedQuery.offset,
    }
  )

  res.json({
    posts: result.posts,
    count: result.count,
    limit: req.validatedQuery.limit,
    offset: req.validatedQuery.offset,
  })
}
