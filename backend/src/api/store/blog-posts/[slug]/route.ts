import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  const post = await blogService.retrievePublishedPostBySlug(req.params.slug)
  const relatedPosts = await blogService.listRelatedPosts({
    post_id: post.id,
    category_ids: (post.categories || []).map((category: { id: string }) => category.id),
    limit: 3,
  })

  res.json({
    post: {
      ...post,
      meta_title: post.seo_title,
      meta_description: post.seo_description,
    },
    related_posts: relatedPosts.map((relatedPost) => ({
      ...relatedPost,
      meta_title: (relatedPost as Record<string, unknown>).seo_title || null,
      meta_description: (relatedPost as Record<string, unknown>).seo_description || null,
    })),
  })
}
