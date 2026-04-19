import { model } from "@medusajs/framework/utils"
import BlogCategory from "./blog-category"
import BlogPost from "./blog-post"

const BlogPostCategory = model.define("blog_post_category", {
  id: model.id().primaryKey(),
  post: model.belongsTo(() => BlogPost, {
    mappedBy: "post_categories",
  }),
  category: model.belongsTo(() => BlogCategory, {
    mappedBy: "post_categories",
  }),
})

export default BlogPostCategory
