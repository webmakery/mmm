import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type DashboardOrder = {
  id: string
  display_id?: number | null
  created_at: string
  currency_code?: string | null
  total?: number | null
  payment_status?: string | null
  fulfillment_status?: string | null
  status?: string | null
  email?: string | null
  items?: Array<{
    title?: string | null
    variant_title?: string | null
    quantity?: number | null
  }>
}

type DashboardCart = {
  id: string
  created_at: string
  updated_at: string
  completed_at?: string | null
  email?: string | null
}

type DashboardVariant = {
  id: string
  title?: string | null
  sku?: string | null
  inventory_quantity?: number | null
  product?: {
    title?: string | null
  } | null
}

type DashboardCustomer = {
  id: string
  created_at: string
}

const toDate = (value: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

const getUtcDayStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addUtcDays = (date: Date, days: number) => {
  const output = new Date(date)
  output.setUTCDate(output.getUTCDate() + days)
  return output
}

const getUtcMonthStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))

const getUtcWeekStart = (date: Date) => {
  const dayStart = getUtcDayStart(date)
  const weekDay = dayStart.getUTCDay() || 7
  return addUtcDays(dayStart, 1 - weekDay)
}

const inRange = (dateValue: string, rangeStart: Date, rangeEndExclusive: Date) => {
  const date = toDate(dateValue)

  if (!date) {
    return false
  }

  const timestamp = date.getTime()

  return timestamp >= rangeStart.getTime() && timestamp < rangeEndExclusive.getTime()
}

const toMoneyAmount = (value?: number | null) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 0
  }

  return value
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const now = new Date()
  const dayStart = getUtcDayStart(now)
  const dayEnd = addUtcDays(dayStart, 1)
  const weekStart = getUtcWeekStart(now)
  const monthStart = getUtcMonthStart(now)

  const [{ data: orders }, { data: customers }, { data: carts }, { data: variants }] =
    await Promise.all([
      query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "created_at",
          "currency_code",
          "total",
          "payment_status",
          "fulfillment_status",
          "status",
          "email",
          "items.title",
          "items.variant_title",
          "items.quantity",
        ],
        pagination: {
          order: {
            created_at: "DESC",
          },
          skip: 0,
          take: 500,
        },
      }),
      query.graph({
        entity: "customer",
        fields: ["id", "created_at"],
        pagination: {
          order: {
            created_at: "DESC",
          },
          skip: 0,
          take: 500,
        },
      }),
      query.graph({
        entity: "cart",
        fields: ["id", "email", "created_at", "updated_at", "completed_at"],
        filters: {
          completed_at: null,
        },
        pagination: {
          order: {
            updated_at: "DESC",
          },
          skip: 0,
          take: 200,
        },
      }),
      query.graph({
        entity: "product_variant",
        fields: ["id", "title", "sku", "inventory_quantity", "product.title"],
        pagination: {
          skip: 0,
          take: 500,
        },
      }),
    ])

  const orderList = (orders as DashboardOrder[]) || []
  const customerList = (customers as DashboardCustomer[]) || []
  const cartList = (carts as DashboardCart[]) || []
  const variantList = (variants as DashboardVariant[]) || []

  const ordersToday = orderList.filter((order) => inRange(order.created_at, dayStart, dayEnd))
  const ordersThisWeek = orderList.filter((order) => inRange(order.created_at, weekStart, dayEnd))
  const ordersThisMonth = orderList.filter((order) => inRange(order.created_at, monthStart, dayEnd))

  const revenueToday = ordersToday.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)
  const revenueThisWeek = ordersThisWeek.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)
  const revenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)

  const customersToday = customerList.filter((customer) => inRange(customer.created_at, dayStart, dayEnd)).length
  const customersThisWeek = customerList.filter((customer) => inRange(customer.created_at, weekStart, dayEnd)).length
  const customersThisMonth = customerList.filter((customer) => inRange(customer.created_at, monthStart, dayEnd)).length

  const topProductMap = new Map<string, { title: string; quantity: number }>()
  const topVariantMap = new Map<string, { title: string; quantity: number }>()

  ordersThisMonth.forEach((order) => {
    order.items?.forEach((item) => {
      const quantity = Number(item.quantity || 0)
      if (!quantity) {
        return
      }

      const productTitle = item.title?.trim() || "Untitled product"
      const variantTitle = item.variant_title?.trim() || "Default variant"

      const productCurrent = topProductMap.get(productTitle) || {
        title: productTitle,
        quantity: 0,
      }
      productCurrent.quantity += quantity
      topProductMap.set(productTitle, productCurrent)

      const variantKey = `${productTitle}::${variantTitle}`
      const variantCurrent = topVariantMap.get(variantKey) || {
        title: `${productTitle} / ${variantTitle}`,
        quantity: 0,
      }
      variantCurrent.quantity += quantity
      topVariantMap.set(variantKey, variantCurrent)
    })
  })

  const lowStockVariants = variantList
    .filter((variant) => typeof variant.inventory_quantity === "number" && variant.inventory_quantity <= 5)
    .sort((a, b) => (a.inventory_quantity || 0) - (b.inventory_quantity || 0))
    .slice(0, 10)

  const outOfStockCount = variantList.filter((variant) => (variant.inventory_quantity || 0) <= 0).length

  const unpaidOrders = orderList.filter((order) => {
    const status = (order.payment_status || "").toLowerCase()
    return status === "awaiting" || status === "not_paid" || status === "partially_paid"
  }).length

  const refundedOrders = orderList.filter((order) => {
    const status = (order.payment_status || "").toLowerCase()
    return status === "refunded" || status === "partially_refunded"
  }).length

  const pendingFulfillment = orderList.filter((order) => {
    const status = (order.fulfillment_status || "").toLowerCase()
    return status === "not_fulfilled" || status === "partially_fulfilled"
  }).length

  const operationalAlerts = [
    {
      id: "out_of_stock",
      title: "Out of stock variants",
      value: outOfStockCount,
    },
    {
      id: "unpaid_orders",
      title: "Unpaid orders",
      value: unpaidOrders,
    },
    {
      id: "open_carts",
      title: "Open carts",
      value: cartList.length,
    },
    {
      id: "pending_fulfillment",
      title: "Pending fulfillment",
      value: pendingFulfillment,
    },
  ]

  res.json({
    generated_at: now.toISOString(),
    currency_code: orderList.find((order) => order.currency_code)?.currency_code || null,
    timezone: "UTC",
    revenue: {
      today: revenueToday,
      this_week: revenueThisWeek,
      this_month: revenueThisMonth,
    },
    orders: {
      today: ordersToday.length,
      this_week: ordersThisWeek.length,
      this_month: ordersThisMonth.length,
      recent: orderList.slice(0, 10).map((order) => ({
        id: order.id,
        display_id: order.display_id,
        created_at: order.created_at,
        total: toMoneyAmount(order.total),
        currency_code: order.currency_code,
        payment_status: order.payment_status,
        fulfillment_status: order.fulfillment_status,
        status: order.status,
        email: order.email,
      })),
    },
    top_products: Array.from(topProductMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    top_variants: Array.from(topVariantMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5),
    inventory: {
      out_of_stock_count: outOfStockCount,
      low_stock: lowStockVariants.map((variant) => ({
        id: variant.id,
        product_title: variant.product?.title || "Untitled product",
        variant_title: variant.title || "Default variant",
        sku: variant.sku,
        inventory_quantity: variant.inventory_quantity || 0,
      })),
    },
    customers: {
      total: customerList.length,
      today: customersToday,
      this_week: customersThisWeek,
      this_month: customersThisMonth,
    },
    carts: {
      open_count: cartList.length,
      recent_open: cartList.slice(0, 10).map((cart) => ({
        id: cart.id,
        email: cart.email,
        created_at: cart.created_at,
        updated_at: cart.updated_at,
      })),
    },
    statuses: {
      refunded_orders: refundedOrders,
      pending_fulfillment: pendingFulfillment,
      unpaid_orders: unpaidOrders,
    },
    operational_alerts: operationalAlerts,
  })
}
