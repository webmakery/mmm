import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

export const PostAdminCreateBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().optional(),
  content: z.unknown().optional(),
  featured_image: z.string().url().optional().nullable(),
  author_name: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  publish_date: z.string().datetime().optional().nullable(),
  status: z.enum(["draft", "published"]).default("draft"),
  category_ids: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

export const GetAdminBlogPostsSchema = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "published"]).optional(),
  category_id: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminCreateBlogPostSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const post = await blogService.createPostWithCategories(req.validatedBody)

  res.json({ post })
}

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminBlogPostsSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const result = await blogService.listAdminPosts(
    {
      q: req.validatedQuery.q,
      status: req.validatedQuery.status,
      category_id: req.validatedQuery.category_id,
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
