import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ArrowPath,
  BuildingStorefront,
  ChartBar,
  CurrencyDollar,
  ExclamationCircle,
  ShoppingBag,
  User,
  Users,
} from "@medusajs/icons"
import { Badge, Container, Heading, Select, StatusBadge, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type DashboardResponse = {
  filters: {
    preset: "today" | "7d" | "30d" | "90d" | "custom"
    from: string
    to: string
  }
  kpis: {
    gross_sales: number
    net_sales: number
    orders: number
    cancelled_orders: number
    new_customers: number
    new_leads: number
    average_order_value: number
    comparisons: {
      gross_sales_change_pct: number
      orders_change_pct: number
      customers_change_pct: number
      cancellation_rate_change_pct: number
    }
  }
  trends: {
    daily: Array<{ date: string; revenue: number; orders: number; cancelled: number }>
  }
  breakdowns: {
    sales_by_status: Record<string, number>
    top_products: Array<{ title: string; revenue: number; quantity: number }>
  }
  lists: {
    recent_orders: Array<{
      id: string
      display_id?: number
      created_at: string
      total: number
      currency_code: string
      status: string
      payment_status: string
      email?: string
    }>
    recent_customer_activity: Array<{
      id: string
      email?: string
      created_at: string
      type: string
    }>
    recent_lead_activity: Array<{
      id: string
      lead_id: string
      lead_name: string
      type: string
      content: string
      created_at: string
    }>
  }
  alerts: Array<{
    id: string
    level: "high" | "medium" | "low"
    title: string
    description: string
    action: string
  }>
}

type RangePreset = "today" | "7d" | "30d" | "90d"

const trendLabel = (value: number) => {
  if (value > 0) {
    return `+${value.toFixed(1)}%`
  }

  return `${value.toFixed(1)}%`
}

const trendColor = (value: number): "green" | "red" | "grey" => {
  if (value > 0.1) {
    return "green"
  }

  if (value < -0.1) {
    return "red"
  }

  return "grey"
}

const alertColor = (value: "high" | "medium" | "low"): "red" | "orange" | "grey" => {
  if (value === "high") {
    return "red"
  }

  if (value === "medium") {
    return "orange"
  }

  return "grey"
}

const DashboardPage = () => {
  const [preset, setPreset] = useState<RangePreset>("30d")

  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: ["admin-dashboard", preset],
    queryFn: () =>
      sdk.client.fetch("/admin/dashboard", {
        query: { preset },
      }),
  })

  const currencyCode = data?.lists.recent_orders[0]?.currency_code || "usd"

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode.toUpperCase(),
        maximumFractionDigits: 2,
      }),
    [currencyCode]
  )

  const chartRows = useMemo(() => {
    return [...(data?.trends.daily || [])]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
  }, [data?.trends.daily])

  if (isLoading) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-8">
          <Heading level="h1">Business dashboard</Heading>
          <Text size="small" className="mt-2 text-ui-fg-subtle">
            Loading metrics...
          </Text>
        </div>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="divide-y p-0">
        <div className="px-6 py-8">
          <Heading level="h1">Business dashboard</Heading>
          <Text size="small" className="mt-2 text-ui-fg-subtle">
            Unable to load dashboard metrics right now.
          </Text>
        </div>
      </Container>
    )
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <Heading level="h1">Business dashboard</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Period: {new Date(data.filters.from).toLocaleDateString()} - {new Date(data.filters.to).toLocaleDateString()}
            </Text>
          </div>
          <Select value={preset} onValueChange={(value) => setPreset(value as RangePreset)}>
            <Select.Trigger>
              <Select.Value placeholder="Select range" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="today">Today</Select.Item>
              <Select.Item value="7d">Last 7 days</Select.Item>
              <Select.Item value="30d">Last 30 days</Select.Item>
              <Select.Item value="90d">Last 90 days</Select.Item>
            </Select.Content>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">Gross sales</Text>
              <CurrencyDollar className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{currencyFormatter.format(data.kpis.gross_sales)}</Heading>
            <StatusBadge color={trendColor(data.kpis.comparisons.gross_sales_change_pct)}>{trendLabel(data.kpis.comparisons.gross_sales_change_pct)}</StatusBadge>
          </Container>

          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">Net sales</Text>
              <ChartBar className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{currencyFormatter.format(data.kpis.net_sales)}</Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">Gross less cancelled orders</Text>
          </Container>

          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">Orders</Text>
              <ShoppingBag className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{data.kpis.orders}</Heading>
            <StatusBadge color={trendColor(data.kpis.comparisons.orders_change_pct)}>{trendLabel(data.kpis.comparisons.orders_change_pct)}</StatusBadge>
          </Container>

          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">Cancelled orders</Text>
              <ExclamationCircle className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{data.kpis.cancelled_orders}</Heading>
            <StatusBadge color={trendColor(-data.kpis.comparisons.cancellation_rate_change_pct)}>{trendLabel(data.kpis.comparisons.cancellation_rate_change_pct)}</StatusBadge>
          </Container>

          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">New customers</Text>
              <Users className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{data.kpis.new_customers}</Heading>
            <StatusBadge color={trendColor(data.kpis.comparisons.customers_change_pct)}>{trendLabel(data.kpis.comparisons.customers_change_pct)}</StatusBadge>
          </Container>

          <Container className="space-y-1 px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="xsmall" className="text-ui-fg-subtle">Average order value</Text>
              <ArrowPath className="text-ui-fg-subtle" />
            </div>
            <Heading level="h2">{currencyFormatter.format(data.kpis.average_order_value)}</Heading>
            <Text size="xsmall" className="text-ui-fg-subtle">Based on total orders in period</Text>
          </Container>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Revenue and order trends</Heading>
            <Badge size="2xsmall" color="blue">Last 14 days</Badge>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Date</Table.HeaderCell>
                <Table.HeaderCell>Revenue</Table.HeaderCell>
                <Table.HeaderCell>Orders</Table.HeaderCell>
                <Table.HeaderCell>Cancelled</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {chartRows.map((day) => (
                <Table.Row key={day.date}>
                  <Table.Cell>{new Date(day.date).toLocaleDateString()}</Table.Cell>
                  <Table.Cell>{currencyFormatter.format(day.revenue)}</Table.Cell>
                  <Table.Cell>{day.orders}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={day.cancelled > 0 ? "red" : "grey"}>{day.cancelled}</StatusBadge>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Container>

        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Sales by status</Heading>
            <Badge size="2xsmall">Live</Badge>
          </div>
          <div className="space-y-2 px-6 py-4">
            {Object.entries(data.breakdowns.sales_by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-md border px-3 py-2">
                <Text size="small">{status.replace(/_/g, " ")}</Text>
                <StatusBadge color={status === "canceled" ? "red" : "grey"}>{count}</StatusBadge>
              </div>
            ))}
            {Object.keys(data.breakdowns.sales_by_status).length === 0 ? (
              <Text size="small" className="text-ui-fg-subtle">No orders in the selected period.</Text>
            ) : null}
          </div>
        </Container>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Container className="divide-y p-0 xl:col-span-2">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Recent orders</Heading>
            <Badge size="2xsmall">{data.lists.recent_orders.length}</Badge>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Order</Table.HeaderCell>
                <Table.HeaderCell>Customer</Table.HeaderCell>
                <Table.HeaderCell>Status</Table.HeaderCell>
                <Table.HeaderCell>Payment</Table.HeaderCell>
                <Table.HeaderCell>Total</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.lists.recent_orders.map((order) => (
                <Table.Row key={order.id}>
                  <Table.Cell>#{order.display_id || order.id.slice(0, 8)}</Table.Cell>
                  <Table.Cell>{order.email || "Guest"}</Table.Cell>
                  <Table.Cell>
                    <StatusBadge color={order.status === "canceled" ? "red" : "grey"}>{order.status}</StatusBadge>
                  </Table.Cell>
                  <Table.Cell>{order.payment_status}</Table.Cell>
                  <Table.Cell>{currencyFormatter.format(order.total)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Container>

        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Top products</Heading>
            <BuildingStorefront />
          </div>
          <div className="space-y-2 px-6 py-4">
            {data.breakdowns.top_products.map((product) => (
              <div key={product.title} className="rounded-md border px-3 py-2">
                <Text size="small" weight="plus" className="truncate">{product.title}</Text>
                <div className="mt-1 flex items-center justify-between">
                  <Text size="xsmall" className="text-ui-fg-subtle">{product.quantity} units</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{currencyFormatter.format(product.revenue)}</Text>
                </div>
              </div>
            ))}
            {!data.breakdowns.top_products.length ? <Text size="small" className="text-ui-fg-subtle">No product sales yet.</Text> : null}
          </div>
        </Container>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Recent customer activity</Heading>
            <User />
          </div>
          <div className="space-y-2 px-6 py-4">
            {data.lists.recent_customer_activity.map((activity) => (
              <div key={activity.id} className="rounded-md border px-3 py-2">
                <Text size="small" weight="plus">{activity.email || "No email"}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">{new Date(activity.created_at).toLocaleString()}</Text>
              </div>
            ))}
            {!data.lists.recent_customer_activity.length ? <Text size="small" className="text-ui-fg-subtle">No customer activity in this range.</Text> : null}
          </div>
        </Container>

        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Recent lead activity</Heading>
            <Users />
          </div>
          <div className="space-y-2 px-6 py-4">
            {data.lists.recent_lead_activity.map((activity) => (
              <div key={activity.id} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Text size="small" weight="plus" className="truncate">{activity.lead_name}</Text>
                  <StatusBadge color="grey">{activity.type}</StatusBadge>
                </div>
                <Text size="xsmall" className="truncate text-ui-fg-subtle">{activity.content || "No details"}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">{new Date(activity.created_at).toLocaleString()}</Text>
              </div>
            ))}
            {!data.lists.recent_lead_activity.length ? <Text size="small" className="text-ui-fg-subtle">No lead activity in this range.</Text> : null}
          </div>
        </Container>

        <Container className="divide-y p-0">
          <div className="flex items-center justify-between px-6 py-4">
            <Heading level="h2">Alerts and actions</Heading>
            <ExclamationCircle />
          </div>
          <div className="space-y-2 px-6 py-4">
            {data.alerts.map((alert) => (
              <div key={alert.id} className="rounded-md border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <Text size="small" weight="plus">{alert.title}</Text>
                  <StatusBadge color={alertColor(alert.level)}>{alert.level}</StatusBadge>
                </div>
                <Text size="xsmall" className="text-ui-fg-subtle">{alert.description}</Text>
                <Text size="xsmall" className="text-ui-fg-subtle">{alert.action}</Text>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Dashboard",
  icon: ChartBar,
})

export default DashboardPage
