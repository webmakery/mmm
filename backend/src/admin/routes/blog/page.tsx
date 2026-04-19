import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, PlusMini } from "@medusajs/icons"
import {
  Badge,
  Button,
  Checkbox,
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  Drawer,
  Heading,
  Input,
  Select,
  Text,
  Textarea,
  toast,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { Controller, useForm } from "react-hook-form"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type BlogCategory = {
  id: string
  name: string
  slug: string
}

type BlogPost = {
  id: string
  title: string
  slug: string
  excerpt?: string | null
  content?: unknown
  featured_image?: string | null
  image_alt?: string | null
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  status: "draft" | "published"
  publish_date?: string | null
  categories?: BlogCategory[]
}

type BlogPostFormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image: string
  image_alt: string
  seo_title: string
  seo_description: string
  canonical_url: string
  status: "draft" | "published"
  category_ids: string[]
}

const emptyFormState: BlogPostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  featured_image: "",
  image_alt: "",
  seo_title: "",
  seo_description: "",
  canonical_url: "",
  status: "draft",
  category_ids: [],
}

const columnHelper = createDataTableColumnHelper<BlogPost>()

const columns = [
  columnHelper.accessor("title", {
    header: "Title",
  }),
  columnHelper.accessor("slug", {
    header: "Slug",
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue()

      return <Badge color={status === "published" ? "green" : "grey"}>{status}</Badge>
    },
  }),
  columnHelper.display({
    id: "categories",
    header: "Categories",
    cell: ({ row }) => {
      const labels = row.original.categories?.map((category) => category.name) || []

      if (!labels.length) {
        return <Text size="small">—</Text>
      }

      return <Text size="small">{labels.join(", ")}</Text>
    },
  }),
]

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const getFormStateFromPost = (post: BlogPost): BlogPostFormState => ({
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt || "",
  content: typeof post.content === "string" ? post.content : post.content ? JSON.stringify(post.content, null, 2) : "",
  featured_image: post.featured_image || "",
  image_alt: post.image_alt || "",
  seo_title: post.seo_title || "",
  seo_description: post.seo_description || "",
  canonical_url: post.canonical_url || "",
  status: post.status,
  category_ids: post.categories?.map((category) => category.id) || [],
})

const BlogAdminPage = () => {
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"__all" | "draft" | "published">("__all")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [categoryName, setCategoryName] = useState("")
  const [creatingCategory, setCreatingCategory] = useState(false)

  const form = useForm<BlogPostFormState>({
    defaultValues: emptyFormState,
  })

  const query = useMemo(
    () => ({
      q: search.trim() || undefined,
      status: statusFilter === "__all" ? undefined : statusFilter,
      limit: pagination.pageSize,
      offset: pagination.pageSize * pagination.pageIndex,
    }),
    [pagination, search, statusFilter]
  )

  const { data, isLoading, refetch } = useQuery<{ posts: BlogPost[]; count: number }>({
    queryKey: ["admin-blog-posts", query],
    queryFn: () => sdk.client.fetch("/admin/blog-posts", { query }),
  })

  const { data: categoryData, refetch: refetchCategories } = useQuery<{ categories: BlogCategory[] }>({
    queryKey: ["admin-blog-categories"],
    queryFn: () =>
      sdk.client.fetch("/admin/blog-categories", {
        query: { limit: 100, offset: 0 },
      }),
  })

  const { data: editingPostData, isFetching: isFetchingPost } = useQuery<{ post: BlogPost }>({
    queryKey: ["admin-blog-post", editingPostId],
    queryFn: () => sdk.client.fetch(`/admin/blog-posts/${editingPostId}`),
    enabled: Boolean(editingPostId && drawerOpen),
  })

  useEffect(() => {
    if (!editingPostId) {
      form.reset(emptyFormState)
      return
    }

    if (editingPostData?.post) {
      form.reset(getFormStateFromPost(editingPostData.post))
    }
  }, [editingPostData, editingPostId, form])

  const table = useDataTable({
    columns,
    data: data?.posts || [],
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick: (_, row) => {
      setEditingPostId(row.id)
      setDrawerOpen(true)
    },
  })

  const onOpenCreate = () => {
    setEditingPostId(null)
    form.reset(emptyFormState)
    setDrawerOpen(true)
  }

  const onCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingPostId(null)
    form.reset(emptyFormState)
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitting(true)

    try {
      const payload = {
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
      }

      if (editingPostId) {
        await sdk.client.fetch(`/admin/blog-posts/${editingPostId}`, {
          method: "POST",
          body: payload,
        })
        toast.success("Blog post updated")
      } else {
        await sdk.client.fetch("/admin/blog-posts", {
          method: "POST",
          body: payload,
        })
        toast.success("Blog post created")
      }

      onCloseDrawer()
      refetch()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save blog post")
    } finally {
      setSubmitting(false)
    }
  })

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

  return (
    <Container>
      <DataTable instance={table}>
        <DataTable.Toolbar className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
          <div>
            <Heading>Blog</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Manage blog posts in admin.
            </Text>
          </div>
          <div className="flex w-full gap-2 md:w-auto">
            <Input placeholder="Search title" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as "__all" | "draft" | "published")}>
              <Select.Trigger>
                <Select.Value placeholder="Status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__all">All statuses</Select.Item>
                <Select.Item value="draft">Draft</Select.Item>
                <Select.Item value="published">Published</Select.Item>
              </Select.Content>
            </Select>
            <Button onClick={onOpenCreate}>
              <PlusMini />
              Create
            </Button>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDrawer()
            return
          }

          setDrawerOpen(true)
        }}
      >
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>{editingPostId ? "Edit Blog Post" : "Create Blog Post"}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <div>
                <Text size="small" weight="plus">
                  Title
                </Text>
                <Controller
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(event) => {
                        const title = event.target.value

                        field.onChange(title)

                        if (!editingPostId) {
                          form.setValue("slug", toSlug(title), { shouldDirty: true })
                        }
                      }}
                      required
                    />
                  )}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Slug
                </Text>
                <Controller
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <Input {...field} onChange={(event) => field.onChange(toSlug(event.target.value))} required />
                  )}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Excerpt
                </Text>
                <Controller
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => <Textarea {...field} rows={3} />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Content
                </Text>
                <Controller
                  control={form.control}
                  name="content"
                  render={({ field }) => <Textarea {...field} rows={8} />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Featured image URL
                </Text>
                <Controller
                  control={form.control}
                  name="featured_image"
                  render={({ field }) => <Input {...field} type="url" placeholder="https://..." />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Featured image alt text
                </Text>
                <Controller
                  control={form.control}
                  name="image_alt"
                  render={({ field }) => <Input {...field} />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Meta title
                </Text>
                <Controller
                  control={form.control}
                  name="seo_title"
                  render={({ field }) => <Input {...field} />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Meta description
                </Text>
                <Controller
                  control={form.control}
                  name="seo_description"
                  render={({ field }) => <Textarea {...field} rows={3} />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Canonical URL
                </Text>
                <Controller
                  control={form.control}
                  name="canonical_url"
                  render={({ field }) => <Input {...field} type="url" placeholder="https://..." />}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Status
                </Text>
                <Controller
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={(value) => field.onChange(value as "draft" | "published")}>
                      <Select.Trigger>
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        <Select.Item value="draft">Draft</Select.Item>
                        <Select.Item value="published">Published</Select.Item>
                      </Select.Content>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus">
                  Categories
                </Text>
                <div className="flex gap-2">
                  <Input
                    placeholder="Category name"
                    value={categoryName}
                    onChange={(event) => setCategoryName(event.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={onCreateCategory}
                    isLoading={creatingCategory}
                    disabled={!categoryName.trim()}
                  >
                    Add category
                  </Button>
                </div>
                <Controller
                  control={form.control}
                  name="category_ids"
                  render={({ field }) => (
                    <div className="flex flex-col gap-2">
                      {(categoryData?.categories || []).map((category) => {
                        const checked = field.value.includes(category.id)

                        return (
                          <label key={category.id} className="flex items-center gap-2">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(value) => {
                                field.onChange(
                                  value
                                    ? [...field.value, category.id]
                                    : field.value.filter((id) => id !== category.id)
                                )
                              }}
                            />
                            <Text size="small">{category.name}</Text>
                          </label>
                        )
                      })}
                    </div>
                  )}
                />
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t bg-ui-bg-base pt-3">
                <Button type="button" variant="secondary" onClick={onCloseDrawer}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting || isFetchingPost} disabled={isFetchingPost}>
                  {editingPostId ? "Save" : "Create"}
                </Button>
              </div>
            </form>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: ChatBubbleLeftRight,
})

export default BlogAdminPage
