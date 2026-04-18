import { Container, Heading, StatusBadge, Table, Text } from "@medusajs/ui"
import { useDashboardData } from "./hooks"

const asCurrency = (amount: number, currencyCode?: string | null) => {
  if (!currencyCode) {
    return "—"
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

const asDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString()
}

const toTitle = (value?: string | null, fallback = "Not set") => {
  const safeValue = (value || "").trim()

  if (!safeValue) {
    return fallback
  }

  return safeValue
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
}

const getOrderStatusColor = (status?: string | null) => {
  const normalized = (status || "").toLowerCase()

  if (normalized.includes("refund")) {
    return "orange" as const
  }

  if (normalized === "captured" || normalized === "paid" || normalized === "fulfilled" || normalized === "completed") {
    return "green" as const
  }

  if (normalized === "awaiting" || normalized === "not_paid" || normalized === "partially_paid") {
    return "red" as const
  }

  if (normalized === "pending" || normalized === "partially_fulfilled" || normalized === "not_fulfilled") {
    return "orange" as const
  }

  return "grey" as const
}

const getLeadStatusColor = (status?: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "won":
      return "green" as const
    case "qualified":
      return "blue" as const
    case "contacted":
      return "orange" as const
    case "lost":
      return "red" as const
    default:
      return "grey" as const
  }
}

const getBookingStatusColor = (status?: string | null) => {
  switch ((status || "").toLowerCase()) {
    case "confirmed":
      return "blue" as const
    case "completed":
      return "green" as const
    case "cancelled":
      return "red" as const
    case "pending":
      return "orange" as const
    default:
      return "grey" as const
  }
}

const EmptyState = ({ text }: { text: string }) => {
  return (
    <div className="px-6 py-8">
      <Text size="small" className="text-ui-fg-subtle">
        {text}
      </Text>
    </div>
  )
}

const Sparkline = ({ values }: { values: number[] }) => {
  if (!values.length) {
    return ""
  }

  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
  const max = Math.max(...values)

  if (max <= 0) {
    return blocks[0].repeat(values.length)
  }

  return values
    .map((value) => {
      const index = Math.min(blocks.length - 1, Math.floor((value / max) * (blocks.length - 1)))
      return blocks[index]
    })
    .join("")
}

const TrendCard = ({
  title,
  series,
  footer,
}: {
  title: string
  series: Array<{ label: string; value: number }>
  footer: string
}) => {
  const values = series.map((item) => item.value)

  return (
    <Container className="px-3 py-3">
      <Text size="xsmall" className="text-ui-fg-subtle">{title}</Text>
      <Heading level="h2" className="font-mono">{Sparkline({ values })}</Heading>
      <Text size="xsmall" className="text-ui-fg-muted">{footer}</Text>
      <Text size="xsmall" className="text-ui-fg-muted">
        {series.map((point) => `${point.label}:${point.value}`).join(" · ")}
      </Text>
    </Container>
  )
}

const DashboardPageContent = () => {
  const { data, isLoading, isError } = useDashboardData()

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Loading dashboard data...
        </Text>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="p-6">
        <Heading level="h2">Dashboard unavailable</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          We could not load live admin metrics right now.
        </Text>
      </Container>
    )
  }

  const pendingActions = data.operational_alerts.reduce((sum, alert) => sum + alert.value, 0)

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Admin dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Business overview across leads, bookings, orders, customers, and operational alerts.
          </Text>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            Updated {asDate(data.generated_at)} ({data.timezone})
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total leads</Text>
            <Heading level="h2">{data.leads.total}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">New leads today</Text>
            <Heading level="h2">{data.leads.new_today}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total bookings</Text>
            <Heading level="h2">{data.bookings.total}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Today’s bookings</Text>
            <Heading level="h2">{data.bookings.today}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total orders</Text>
            <Heading level="h2">{data.orders.total}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue this month</Text>
            <Heading level="h2">{asCurrency(data.revenue.this_month, data.currency_code)}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total customers</Text>
            <Heading level="h2">{data.customers.total}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Pending actions</Text>
            <Heading level="h2">{pendingActions}</Heading>
          </Container>
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Performance charts</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
          <TrendCard
            title="Leads over last 7 days"
            series={data.charts.leads_last_7_days}
            footer={`Total: ${data.charts.leads_last_7_days.reduce((sum, point) => sum + point.value, 0)}`}
          />
          <TrendCard
            title="Bookings over last 7 days"
            series={data.charts.bookings_last_7_days}
            footer={`Total: ${data.charts.bookings_last_7_days.reduce((sum, point) => sum + point.value, 0)}`}
          />
          <TrendCard
            title="Revenue over last 30 days"
            series={data.charts.revenue_last_30_days}
            footer={`Total: ${asCurrency(
              data.charts.revenue_last_30_days.reduce((sum, point) => sum + point.value, 0),
              data.currency_code
            )}`}
          />
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Recent leads</Heading>
          </div>
          {data.leads.recent.length ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Lead</Table.HeaderCell>
                  <Table.HeaderCell>Company</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Follow-up</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.leads.recent.map((lead) => (
                  <Table.Row key={lead.id}>
                    <Table.Cell>{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unnamed lead"}</Table.Cell>
                    <Table.Cell>{lead.company || "—"}</Table.Cell>
                    <Table.Cell>{lead.email || "—"}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={getLeadStatusColor(lead.status)}>{toTitle(lead.status, "New")}</StatusBadge>
                    </Table.Cell>
                    <Table.Cell>{asDate(lead.next_follow_up_at)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <EmptyState text="No leads yet." />
          )}
        </Container>

        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Upcoming bookings</Heading>
          </div>
          {data.bookings.upcoming.length ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Booking</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Service</Table.HeaderCell>
                  <Table.HeaderCell>Scheduled</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.bookings.upcoming.map((booking) => (
                  <Table.Row key={booking.id}>
                    <Table.Cell>{booking.reference || booking.id.slice(0, 8)}</Table.Cell>
                    <Table.Cell>{booking.customer_full_name || booking.customer_email || "—"}</Table.Cell>
                    <Table.Cell>{booking.service_name || "Service"}</Table.Cell>
                    <Table.Cell>{asDate(booking.scheduled_start_at)}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={getBookingStatusColor(booking.status)}>{toTitle(booking.status, "Pending")}</StatusBadge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <EmptyState text="No upcoming bookings." />
          )}
        </Container>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Container className="xl:col-span-2 p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Recent orders</Heading>
          </div>

          {data.orders.recent.length ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Order</Table.HeaderCell>
                  <Table.HeaderCell>Customer</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell>Total</Table.HeaderCell>
                  <Table.HeaderCell>Payment</Table.HeaderCell>
                  <Table.HeaderCell>Fulfillment</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.orders.recent.map((order) => (
                  <Table.Row key={order.id}>
                    <Table.Cell>#{order.display_id || order.id.slice(0, 8)}</Table.Cell>
                    <Table.Cell>{order.email || "—"}</Table.Cell>
                    <Table.Cell>{asDate(order.created_at)}</Table.Cell>
                    <Table.Cell>{asCurrency(order.total, order.currency_code || data.currency_code)}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={getOrderStatusColor(order.payment_status)}>
                        {toTitle(order.payment_status, "Not set")}
                      </StatusBadge>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={getOrderStatusColor(order.fulfillment_status)}>
                        {toTitle(order.fulfillment_status, "Not set")}
                      </StatusBadge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <EmptyState text="No orders yet." />
          )}
        </Container>

        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Operational alerts</Heading>
          </div>
          <div className="divide-y">
            {data.operational_alerts.map((alert) => (
              <div className="flex items-center justify-between px-6 py-3" key={alert.id}>
                <Text size="small">{alert.title}</Text>
                <StatusBadge color={alert.value > 0 ? "orange" : "green"}>{alert.value}</StatusBadge>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </div>
  )
}

export default DashboardPageContent
