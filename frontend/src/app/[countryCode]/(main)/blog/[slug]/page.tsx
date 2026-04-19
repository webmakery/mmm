import { retrieveBlogPost } from "@lib/data/blog"
import BlogDetailsTemplate from "@modules/blog/templates/details"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type BlogPostPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata(props: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await props.params

  try {
    const { post } = await retrieveBlogPost(slug)

    return {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt || "",
    }
  } catch {
    return {
      title: "Blog post",
      description: "Blog post details",
    }
  }
}

export default async function BlogPostPage(props: BlogPostPageProps) {
  const { slug } = await props.params

  try {
    return <BlogDetailsTemplate slug={slug} />
  } catch {
    notFound()
  }
}
