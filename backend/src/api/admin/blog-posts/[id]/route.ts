import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"

export const PostAdminUpdateBlogPostSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  excerpt: z.string().optional().nullable(),
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
  status: z.enum(["draft", "published"]).optional(),
  category_ids: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)
  const post = await blogService.retrieveAdminPost(req.params.id)

  res.json({
    post: {
      ...post,
      meta_title: (post as Record<string, unknown>).seo_title || null,
      meta_description: (post as Record<string, unknown>).seo_description || null,
    },
  })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminUpdateBlogPostSchema>>, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const post = await blogService.updatePostWithCategories(req.params.id, {
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

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  await blogService.deletePostWithRelations(req.params.id)

  res.status(200).json({ id: req.params.id, object: "blog_post", deleted: true })
}
