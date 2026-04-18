import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus } from "@medusajs/icons"
import {
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  Heading,
  StatusBadge,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type AdminOrder = {
  id: string
  display_id: number
  created_at: string
  total: number
  currency_code: string
  sales_channel?: {
    name?: string
  } | null
  customer?: {
    first_name?: string | null
    last_name?: string | null
    email?: string | null
  } | null
  email?: string | null
  payment_status?: string | null
  fulfillment_status?: string | null
}

type QuickFilter = "all" | "paid" | "unfulfilled" | "delivered"

const PAGE_SIZE = 20
const columnHelper = createDataTableColumnHelper<AdminOrder>()

const titleize = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
}

const formatCurrency = (value: number, currencyCode?: string | null) => {
  const safeCode = (currencyCode || "usd").toUpperCase()

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: safeCode,
      minimumFractionDigits: 2,
    }).format((value || 0) / 100)
  } catch (_error) {
    return `${((value || 0) / 100).toFixed(2)} ${safeCode}`
  }
}

const getPaymentBadgeColor = (status?: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "captured":
    case "paid":
      return "green"
    case "authorized":
    case "pending":
    case "requires_action":
      return "orange"
    case "refunded":
      return "blue"
    case "canceled":
    case "cancelled":
      return "red"
    default:
      return "grey"
  }
}

const getFulfillmentBadgeColor = (status?: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "delivered":
    case "fulfilled":
    case "shipped":
      return "green"
    case "partially_fulfilled":
    case "partially_shipped":
      return "orange"
    case "not_fulfilled":
    case "requires_action":
      return "grey"
    case "canceled":
    case "cancelled":
      return "red"
    default:
      return "grey"
  }
}

const OrdersPage = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState("")
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all")
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  })
  const setQuickFilterAndReset = (nextFilter: QuickFilter) => {
    setQuickFilter(nextFilter)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const offset = useMemo(() => pagination.pageIndex * pagination.pageSize, [pagination])

  const query = useMemo(() => {
    const next: Record<string, string | number | undefined> = {
      limit: pagination.pageSize,
      offset,
      order: "-created_at",
      q: search || undefined,
    }

    if (quickFilter === "paid") {
      next.payment_status = "captured"
    }

    if (quickFilter === "unfulfilled") {
      next.fulfillment_status = "not_fulfilled"
    }

    if (quickFilter === "delivered") {
      next.fulfillment_status = "delivered"
    }

    return next
  }, [offset, pagination.pageSize, quickFilter, search])

  const { data, isLoading } = useQuery<{ orders: AdminOrder[]; count: number }>({
    queryKey: ["orders", query],
    queryFn: () =>
      sdk.client.fetch("/admin/orders", {
        query,
      }),
  })

  const orders = data?.orders || []

  const metrics = useMemo(() => {
    const paid = orders.filter((order) => ["captured", "paid"].includes((order.payment_status || "").toLowerCase())).length
    const awaitingFulfillment = orders.filter((order) => (order.fulfillment_status || "").toLowerCase() === "not_fulfilled").length
    const delivered = orders.filter((order) => ["fulfilled", "delivered"].includes((order.fulfillment_status || "").toLowerCase())).length
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0)

    return {
      paid,
      awaitingFulfillment,
      delivered,
      revenue,
    }
  }, [orders])

  const columns = useMemo(
    () => [
      columnHelper.accessor("display_id", {
        header: "Order",
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col">
            <Text weight="plus">#{row.original.display_id}</Text>
            <Text size="small" className="text-ui-fg-subtle">
              {new Date(row.original.created_at).toLocaleString()}
            </Text>
          </div>
        ),
      }),
      columnHelper.accessor("customer", {
        header: "Customer",
        cell: ({ row }) => {
          const fullName = `${row.original.customer?.first_name || ""} ${row.original.customer?.last_name || ""}`.trim()
          const email = row.original.customer?.email || row.original.email || "-"

          return (
            <div className="flex min-w-0 flex-col">
              <Text weight="plus">{fullName || email}</Text>
              {fullName ? (
                <Text size="small" className="text-ui-fg-subtle">
                  {email}
                </Text>
              ) : null}
            </div>
          )
        },
      }),
      columnHelper.accessor("sales_channel", {
        header: "Sales channel",
        cell: ({ row }) => (
          <Text size="small" className="text-ui-fg-subtle">
            {row.original.sales_channel?.name || "-"}
          </Text>
        ),
      }),
      columnHelper.accessor("payment_status", {
        header: "Payment",
        cell: ({ row }) => (
          <StatusBadge color={getPaymentBadgeColor(row.original.payment_status)}>
            {titleize(row.original.payment_status)}
          </StatusBadge>
        ),
      }),
      columnHelper.accessor("fulfillment_status", {
        header: "Fulfillment",
        cell: ({ row }) => (
          <StatusBadge color={getFulfillmentBadgeColor(row.original.fulfillment_status)}>
            {titleize(row.original.fulfillment_status)}
          </StatusBadge>
        ),
      }),
      columnHelper.accessor("total", {
        header: "Total",
        meta: {
          align: "right",
        },
        cell: ({ row }) => (
          <Text className="text-right" weight="plus">
            {formatCurrency(row.original.total, row.original.currency_code)}
          </Text>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        meta: {
          align: "right",
        },
        cell: ({ row }) => (
          <Button size="small" variant="secondary" asChild>
            <Link to={`/orders/${row.original.id}`}>View order</Link>
          </Button>
        ),
      }),
    ],
    []
  )

  const table = useDataTable({
    columns,
    data: orders,
    getRowId: (row) => row.id,
    rowCount: data?.count || 0,
    isLoading,
    onRowClick: (_event, row) => navigate(`/orders/${row.id}`),
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    search: {
      state: search,
      onSearchChange: (next) => {
        setSearch(next)
        setPagination((prev) => ({ ...prev, pageIndex: 0 }))
      },
    },
  })

  const exportSearch = new URLSearchParams()
  if (search) {
    exportSearch.set("q", search)
  }
  if (quickFilter === "paid") {
    exportSearch.set("payment_status", "captured")
  }
  if (quickFilter === "unfulfilled") {
    exportSearch.set("fulfillment_status", "not_fulfilled")
  }
  if (quickFilter === "delivered") {
    exportSearch.set("fulfillment_status", "delivered")
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Heading>Orders</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Track payment, fulfillment, and customer activity in one view.
            </Text>
          </div>
          <Button size="small" variant="secondary" asChild>
            <Link to={`/orders/export?${exportSearch.toString()}`}>Export</Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total orders</Text>
            <Heading level="h2">{data?.count || 0}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Awaiting fulfillment</Text>
            <Heading level="h2">{metrics.awaitingFulfillment}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Paid</Text>
            <Heading level="h2">{metrics.paid}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue</Text>
            <Heading level="h2">{formatCurrency(metrics.revenue, orders[0]?.currency_code || "usd")}</Heading>
          </Container>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="small" variant={quickFilter === "all" ? "primary" : "secondary"} onClick={() => setQuickFilterAndReset("all")}>
            All
          </Button>
          <Button size="small" variant={quickFilter === "paid" ? "primary" : "secondary"} onClick={() => setQuickFilterAndReset("paid")}>
            Paid
          </Button>
          <Button size="small" variant={quickFilter === "unfulfilled" ? "primary" : "secondary"} onClick={() => setQuickFilterAndReset("unfulfilled")}>
            Unfulfilled
          </Button>
          <Button size="small" variant={quickFilter === "delivered" ? "primary" : "secondary"} onClick={() => setQuickFilterAndReset("delivered")}>
            Delivered
          </Button>
        </div>
      </div>

      <DataTable instance={table}>
        <DataTable.Toolbar className="px-6 py-4" />
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Orders",
  icon: SquaresPlus,
})

export default OrdersPage
