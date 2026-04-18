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

const getOrderStatusColor = (status?: string | null) => {
  const normalized = (status || "").toLowerCase()

  if (normalized.includes("refund")) {
    return "orange" as const
  }

  if (normalized === "captured" || normalized === "paid" || normalized === "fulfilled") {
    return "green" as const
  }

  if (normalized === "awaiting" || normalized === "not_paid" || normalized === "partially_paid") {
    return "red" as const
  }

  return "grey" as const
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

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Admin dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Live business overview from orders, products, inventory, customers, and carts.
          </Text>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            Updated {asDate(data.generated_at)} ({data.timezone})
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue today</Text>
            <Heading level="h2">{asCurrency(data.revenue.today, data.currency_code)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">{data.orders.today} orders</Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue this week</Text>
            <Heading level="h2">{asCurrency(data.revenue.this_week, data.currency_code)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">{data.orders.this_week} orders</Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue this month</Text>
            <Heading level="h2">{asCurrency(data.revenue.this_month, data.currency_code)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">{data.orders.this_month} orders</Text>
          </Container>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Customers total</Text>
            <Heading level="h2">{data.customers.total}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">+{data.customers.this_month} this month</Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Open carts</Text>
            <Heading level="h2">{data.carts.open_count}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">Abandoned or in-progress</Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Refunded orders</Text>
            <Heading level="h2">{data.statuses.refunded_orders}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">Payment status snapshot</Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Pending fulfillment</Text>
            <Heading level="h2">{data.statuses.pending_fulfillment}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">Needs warehouse action</Text>
          </Container>
        </div>
      </Container>

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
                        {order.payment_status || "unknown"}
                      </StatusBadge>
                    </Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={getOrderStatusColor(order.fulfillment_status)}>
                        {order.fulfillment_status || "unknown"}
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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Top products (this month)</Heading>
          </div>
          {data.top_products.length ? (
            <div className="divide-y">
              {data.top_products.map((product) => (
                <div className="flex items-center justify-between px-6 py-3" key={product.title}>
                  <Text size="small">{product.title}</Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {product.quantity} sold
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No product sales yet this month." />
          )}
        </Container>

        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Top variants (this month)</Heading>
          </div>
          {data.top_variants.length ? (
            <div className="divide-y">
              {data.top_variants.map((variant) => (
                <div className="flex items-center justify-between px-6 py-3" key={variant.title}>
                  <Text size="small">{variant.title}</Text>
                  <Text size="small" className="text-ui-fg-subtle">
                    {variant.quantity} sold
                  </Text>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No variant sales yet this month." />
          )}
        </Container>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Low stock / out of stock</Heading>
          </div>
          {data.inventory.low_stock.length ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Product</Table.HeaderCell>
                  <Table.HeaderCell>Variant</Table.HeaderCell>
                  <Table.HeaderCell>SKU</Table.HeaderCell>
                  <Table.HeaderCell>Qty</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.inventory.low_stock.map((variant) => (
                  <Table.Row key={variant.id}>
                    <Table.Cell>{variant.product_title}</Table.Cell>
                    <Table.Cell>{variant.variant_title}</Table.Cell>
                    <Table.Cell>{variant.sku || "—"}</Table.Cell>
                    <Table.Cell>
                      <StatusBadge color={variant.inventory_quantity <= 0 ? "red" : "orange"}>
                        {variant.inventory_quantity}
                      </StatusBadge>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <EmptyState text="No low-stock variants right now." />
          )}
        </Container>

        <Container className="p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Open carts</Heading>
          </div>
          {data.carts.recent_open.length ? (
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Cart</Table.HeaderCell>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Created</Table.HeaderCell>
                  <Table.HeaderCell>Updated</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {data.carts.recent_open.map((cart) => (
                  <Table.Row key={cart.id}>
                    <Table.Cell>{cart.id.slice(0, 8)}</Table.Cell>
                    <Table.Cell>{cart.email || "—"}</Table.Cell>
                    <Table.Cell>{asDate(cart.created_at)}</Table.Cell>
                    <Table.Cell>{asDate(cart.updated_at)}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          ) : (
            <EmptyState text="No open carts." />
          )}
        </Container>
      </div>
    </div>
  )
}

export default DashboardPageContent
