import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ChatBubbleLeftRight, PlusMini } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  createDataTableColumnHelper,
  DataTable,
  DataTablePaginationState,
  Heading,
  Input,
  Select,
  Text,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"
import { BlogPost } from "./blog-utils"

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

const BlogAdminPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: 15,
    pageIndex: 0,
  })
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"__all" | "draft" | "published">("__all")

  const query = useMemo(
    () => ({
      q: search.trim() || undefined,
      status: statusFilter === "__all" ? undefined : statusFilter,
      limit: pagination.pageSize,
      offset: pagination.pageSize * pagination.pageIndex,
    }),
    [pagination, search, statusFilter]
  )

  const { data, isLoading } = useQuery<{ posts: BlogPost[]; count: number }>({
    queryKey: ["admin-blog-posts", query],
    queryFn: () => sdk.client.fetch("/admin/blog-posts", { query }),
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
      navigate(`/blog/${row.id}`)
    },
  })

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
            <Button onClick={() => navigate("/blog/create")}>
              <PlusMini />
              Create
            </Button>
          </div>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Blog",
  icon: ChatBubbleLeftRight,
})

export default BlogAdminPage
