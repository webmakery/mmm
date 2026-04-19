import { Container, Heading, Text, toast } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"
import BlogPostForm from "../components/blog-post-form"
import { BlogCategory, BlogPost, BlogPostFormState, emptyFormState, getFormStateFromPost, toSlug } from "../blog-utils"

const BlogEditPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)

  const form = useForm<BlogPostFormState>({
    defaultValues: emptyFormState,
  })

  const { data: categoryData, refetch: refetchCategories } = useQuery<{ categories: BlogCategory[] }>({
    queryKey: ["admin-blog-categories"],
    queryFn: () =>
      sdk.client.fetch("/admin/blog-categories", {
        query: { limit: 100, offset: 0 },
      }),
  })

  const { data: editingPostData, isFetching: isFetchingPost } = useQuery<{ post: BlogPost }>({
    queryKey: ["admin-blog-post", id],
    queryFn: () => sdk.client.fetch(`/admin/blog-posts/${id}`),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (editingPostData?.post) {
      form.reset(getFormStateFromPost(editingPostData.post))
    }
  }, [editingPostData, form])

  const onCreateCategory = async () => {
    const name = categoryName.trim()

    if (!name) {
      return
    }

    setCreatingCategory(true)

    try {
      await sdk.client.fetch("/admin/blog-categories", {
        method: "POST",
        body: {
          name,
          slug: toSlug(name),
        },
      })
      toast.success("Blog category created")
      setCategoryName("")
      await refetchCategories()
    } catch (error) {
      console.error(error)
      toast.error("Failed to create blog category")
    } finally {
      setCreatingCategory(false)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    if (!id) {
      return
    }

    setSubmitting(true)

    try {
      await sdk.client.fetch(`/admin/blog-posts/${id}`, {
        method: "POST",
        body: {
          title: values.title.trim(),
          slug: values.slug.trim(),
          excerpt: values.excerpt.trim() || null,
          content: values.content.trim() || null,
          featured_image: values.featured_image.trim() || null,
          image_alt: values.image_alt.trim() || null,
          seo_title: values.seo_title.trim() || null,
          seo_description: values.seo_description.trim() || null,
          canonical_url: values.canonical_url.trim() || null,
          status: values.status,
          category_ids: values.category_ids,
        },
      })

      toast.success("Blog post updated")
      navigate("/blog")
    } catch (error) {
      console.error(error)
      toast.error("Failed to save blog post")
    } finally {
      setSubmitting(false)
    }
  })

  return (
    <Container className="max-w-3xl">
      <div className="mb-4">
        <Heading level="h1">Edit Blog Post</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Update and save blog post changes.
        </Text>
      </div>
      <BlogPostForm
        form={form}
        editingPostId={id}
        onSubmit={onSubmit}
        onCancel={() => navigate("/blog")}
        categoryData={categoryData}
        categoryName={categoryName}
        setCategoryName={setCategoryName}
        onCreateCategory={onCreateCategory}
        creatingCategory={creatingCategory}
        submitting={submitting}
        isFetchingPost={isFetchingPost}
      />
    </Container>
  )
}

export default BlogEditPage
