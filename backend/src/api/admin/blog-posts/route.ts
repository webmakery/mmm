import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BLOG_MODULE } from "../../../modules/blog"
import BlogModuleService from "../../../modules/blog/service"

export const PostAdminCreateBlogPostSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  excerpt: z.string().optional(),
  content: z.unknown().optional(),
  featured_image: z.string().url().optional().nullable(),
  image_alt: z.string().optional().nullable(),
  author_name: z.string().optional().nullable(),
  seo_title: z.string().optional().nullable(),
  seo_description: z.string().optional().nullable(),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
  canonical_url: z.string().url().optional().nullable(),
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

  const post = await blogService.createPostWithCategories({
    ...req.validatedBody,
    seo_title: req.validatedBody.seo_title ?? req.validatedBody.meta_title,
    seo_description: req.validatedBody.seo_description ?? req.validatedBody.meta_description,
  })

  res.json({
    post: {
      ...post,
      meta_title: (post as Record<string, unknown>).seo_title || null,
      meta_description: (post as Record<string, unknown>).seo_description || null,
    },
  })
}

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminBlogPostsSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const query = req.validatedQuery as z.infer<typeof GetAdminBlogPostsSchema>

  const result = await blogService.listAdminPosts(
    {
      q: query.q,
      status: query.status,
      category_id: query.category_id,
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
