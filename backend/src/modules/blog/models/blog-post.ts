import { model } from "@medusajs/framework/utils"
import BlogPostCategory from "./blog-post-category"

const BlogPost = model.define("blog_post", {
  id: model.id().primaryKey(),
  title: model.text(),
  slug: model.text().unique(),
  excerpt: model.text().nullable(),
  content: model.json().nullable(),
  featured_image: model.text().nullable(),
  author_name: model.text().nullable(),
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  publish_date: model.dateTime().nullable(),
  status: model.enum(["draft", "published"]).default("draft"),
  tags: model.json().nullable(),
  post_categories: model.hasMany(() => BlogPostCategory, {
    mappedBy: "post",
  }),
})

export default BlogPost
