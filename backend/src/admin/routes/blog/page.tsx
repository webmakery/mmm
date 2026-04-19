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
import { FormEvent, useMemo, useState } from "react"
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
  status: "draft" | "published"
  publish_date?: string | null
  categories?: BlogCategory[]
}

type BlogPostFormState = {
  title: string
  slug: string
  excerpt: string
  content: string
  status: "draft" | "published"
  category_ids: string[]
}

const emptyFormState: BlogPostFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
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
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [formState, setFormState] = useState<BlogPostFormState>(emptyFormState)
  const [submitting, setSubmitting] = useState(false)

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

  const { data: categoryData } = useQuery<{ categories: BlogCategory[] }>({
    queryKey: ["admin-blog-categories"],
    queryFn: () =>
      sdk.client.fetch("/admin/blog-categories", {
        query: { limit: 100, offset: 0 },
      }),
  })

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
      setEditingPost(row)
      setFormState(getFormStateFromPost(row))
      setDrawerOpen(true)
    },
  })

  const onOpenCreate = () => {
    setEditingPost(null)
    setFormState(emptyFormState)
    setDrawerOpen(true)
  }

  const onCloseDrawer = () => {
    setDrawerOpen(false)
    setEditingPost(null)
    setFormState(emptyFormState)
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const payload = {
        title: formState.title.trim(),
        slug: formState.slug.trim(),
        excerpt: formState.excerpt.trim() || null,
        content: formState.content.trim() || null,
        status: formState.status,
        category_ids: formState.category_ids,
      }

      if (editingPost) {
        await sdk.client.fetch(`/admin/blog-posts/${editingPost.id}`, {
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
            <Drawer.Title>{editingPost ? "Edit Blog Post" : "Create Blog Post"}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <form onSubmit={onSubmit} className="flex flex-col gap-3">
              <div>
                <Text size="small" weight="plus">
                  Title
                </Text>
                <Input
                  value={formState.title}
                  onChange={(event) => {
                    const title = event.target.value

                    setFormState((prev) => ({
                      ...prev,
                      title,
                      slug: editingPost ? prev.slug : toSlug(title),
                    }))
                  }}
                  required
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Slug
                </Text>
                <Input
                  value={formState.slug}
                  onChange={(event) => setFormState((prev) => ({ ...prev, slug: toSlug(event.target.value) }))}
                  required
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Excerpt
                </Text>
                <Textarea
                  value={formState.excerpt}
                  onChange={(event) => setFormState((prev) => ({ ...prev, excerpt: event.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Content
                </Text>
                <Textarea
                  value={formState.content}
                  onChange={(event) => setFormState((prev) => ({ ...prev, content: event.target.value }))}
                  rows={8}
                />
              </div>

              <div>
                <Text size="small" weight="plus">
                  Status
                </Text>
                <Select
                  value={formState.status}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, status: value as "draft" | "published" }))}
                >
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="draft">Draft</Select.Item>
                    <Select.Item value="published">Published</Select.Item>
                  </Select.Content>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Text size="small" weight="plus">
                  Categories
                </Text>
                {(categoryData?.categories || []).map((category) => {
                  const checked = formState.category_ids.includes(category.id)

                  return (
                    <label key={category.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => {
                          setFormState((prev) => ({
                            ...prev,
                            category_ids: value
                              ? [...prev.category_ids, category.id]
                              : prev.category_ids.filter((id) => id !== category.id),
                          }))
                        }}
                      />
                      <Text size="small">{category.name}</Text>
                    </label>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCloseDrawer}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={submitting}>
                  {editingPost ? "Save" : "Create"}
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
