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

  res.json({ post, related_posts: relatedPosts })
}
