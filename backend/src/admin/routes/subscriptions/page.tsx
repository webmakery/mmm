import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ClockSolid } from "@medusajs/icons"
import {
  Container,
  Heading,
  StatusBadge,
  createDataTableColumnHelper,
  useDataTable,
  DataTablePaginationState,
  DataTable,
} from "@medusajs/ui"
import { useMemo, useState } from "react"
import { SubscriptionData, SubscriptionStatus } from "../../types"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"
import { useNavigate } from "react-router-dom"

const PAGE_SIZE = 15

const getStatusColor = (status: SubscriptionStatus) => {
  switch (status) {
    case SubscriptionStatus.CANCELED:
      return "orange"
    case SubscriptionStatus.FAILED:
      return "red"
    case SubscriptionStatus.EXPIRED:
      return "grey"
    default:
      return "green"
  }
}

const getStatusLabel = (status: SubscriptionStatus) => {
  return status.charAt(0).toUpperCase() + status.substring(1)
}

const formatDate = (date: string | null | undefined) => {
  if (!date) {
    return "-"
  }

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return "-"
  }

  return parsedDate.toLocaleString()
}

const columnHelper = createDataTableColumnHelper<SubscriptionData>()

const columns = [
  columnHelper.accessor("id", {
    header: "#",
  }),
  columnHelper.accessor("metadata.main_order_id", {
    header: "Main Order",
  }),
  columnHelper.accessor("customer.email", {
    header: "Customer",
  }),
  columnHelper.accessor("subscription_date", {
    header: "Subscription Date",
    cell: ({ getValue }) => {
      return formatDate(getValue())
    },
  }),
  columnHelper.accessor("expiration_date", {
    header: "Expiry Date",
    cell: ({ getValue }) => {
      return formatDate(getValue())
    },
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => {
      return (
        <StatusBadge color={getStatusColor(getValue())}>
          {getStatusLabel(getValue())}
        </StatusBadge>
      )
    },
  }),
]

const SubscriptionsPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  })

  const offset = useMemo(() => {
    return pagination.pageIndex * pagination.pageSize
  }, [pagination])

  const { data, isLoading } = useQuery<{
    subscriptions: SubscriptionData[]
    count: number
  }>({
    queryFn: () =>
      sdk.client.fetch(`/admin/subscriptions`, {
        query: {
          limit: pagination.pageSize,
          offset,
          order: "-created_at",
        },
      }),
    queryKey: ["subscriptions", pagination.pageSize, offset],
  })

  const table = useDataTable({
    columns,
    data: data?.subscriptions || [],
    getRowId: (subscription) => subscription.id,
    rowCount: data?.count || 0,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
    onRowClick(_event, row) {
      navigate(`/subscriptions/${row.id}`)
    },
  })

  return (
    <Container className="divide-y p-0">
      <DataTable instance={table}>
        <DataTable.Toolbar className="px-6 py-4">
          <Heading>Subscriptions</Heading>
        </DataTable.Toolbar>
        <DataTable.Table />
        <DataTable.Pagination />
      </DataTable>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscriptions",
  icon: ClockSolid,
})

export default SubscriptionsPage
