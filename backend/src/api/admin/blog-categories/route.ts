import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

export const PostAdminCreateBlogCategorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional().nullable(),
})

export const GetAdminBlogCategoriesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminCreateBlogCategorySchema>>,
  res: MedusaResponse
) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const category = await blogService.createBlogCategories(req.validatedBody)

  res.json({ category })
}

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminBlogCategoriesSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const [categories, [, count]] = await Promise.all([
    blogService.listBlogCategories({}, { take: req.validatedQuery.limit, skip: req.validatedQuery.offset }),
    blogService.listAndCountBlogCategories({}, {}),
  ])

  res.json({
    categories,
    count,
    limit: req.validatedQuery.limit,
    offset: req.validatedQuery.offset,
  })
}
