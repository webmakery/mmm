import { model } from "@medusajs/framework/utils"
import BlogPostCategory from "./blog-post-category"

const BlogCategory = model.define("blog_category", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  description: model.text().nullable(),
  post_categories: model.hasMany(() => BlogPostCategory, {
    mappedBy: "category",
  }),
})

export default BlogCategory
