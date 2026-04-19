import { Metadata } from "next"

import BlogTemplate from "@modules/blog/templates"

export const metadata: Metadata = {
  title: "Blog",
  description: "News, guides, and updates.",
}

type Params = {
  searchParams: Promise<{
    page?: string
    q?: string
    category?: string
  }>
}

export default async function BlogPage(props: Params) {
  const searchParams = await props.searchParams

  return <BlogTemplate page={searchParams.page} q={searchParams.q} category={searchParams.category} />
}
