import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BLOG_MODULE } from "../../../../modules/blog"
import BlogModuleService from "../../../../modules/blog/service"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const blogService: BlogModuleService = req.scope.resolve(BLOG_MODULE)

  await blogService.deleteBlogCategories(req.params.id)

  res.status(200).json({ id: req.params.id, object: "blog_category", deleted: true })
}
