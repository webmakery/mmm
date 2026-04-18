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
}

type DashboardCart = {
  id: string
  created_at: string
  updated_at: string
  completed_at?: string | null
  email?: string | null
}

type DashboardCustomer = {
  id: string
  created_at: string
}

type DashboardLead = {
  id: string
  created_at: string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  company?: string | null
  status?: string | null
  owner_user_id?: string | null
  next_follow_up_at?: string | null
}

type DashboardBooking = {
  id: string
  reference?: string | null
  customer_full_name: string
  customer_email?: string | null
  status?: string | null
  scheduled_start_at: string
  created_at: string
  service?: {
    name?: string | null
  } | null
}

type DashboardVariant = {
  id: string
  inventory_quantity?: number | null
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

const formatUtcDayKey = (date: Date) => date.toISOString().slice(0, 10)

const buildDailySeries = (
  days: number,
  now: Date,
  getSourceDate: (item: any) => string,
  source: any[],
  getValue?: (item: any) => number
) => {
  const dayStart = getUtcDayStart(now)
  const series = Array.from({ length: days }).map((_, index) => {
    const date = addUtcDays(dayStart, -(days - index - 1))

    return {
      date: formatUtcDayKey(date),
      label: date.toISOString().slice(5, 10),
      value: 0,
    }
  })

  const seriesIndex = new Map(series.map((item, index) => [item.date, index]))

  source.forEach((item) => {
    const date = toDate(getSourceDate(item))

    if (!date) {
      return
    }

    const key = formatUtcDayKey(getUtcDayStart(date))
    const index = seriesIndex.get(key)

    if (index === undefined) {
      return
    }

    series[index].value += getValue ? getValue(item) : 1
  })

  return series
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

  const [orderResult, customerResult, cartResult, variantResult, leadResult, bookingResult] =
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
        fields: ["id", "inventory_quantity"],
        pagination: {
          skip: 0,
          take: 500,
        },
      }),
      query.graph({
        entity: "lead",
        fields: [
          "id",
          "created_at",
          "first_name",
          "last_name",
          "email",
          "company",
          "status",
          "owner_user_id",
          "next_follow_up_at",
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
        entity: "booking",
        fields: [
          "id",
          "reference",
          "customer_full_name",
          "customer_email",
          "status",
          "scheduled_start_at",
          "created_at",
          "service.name",
        ],
        pagination: {
          order: {
            scheduled_start_at: "ASC",
          },
          skip: 0,
          take: 500,
        },
      }),
    ])

  const orderList = (orderResult.data as DashboardOrder[]) || []
  const customerList = (customerResult.data as DashboardCustomer[]) || []
  const cartList = (cartResult.data as DashboardCart[]) || []
  const variantList = (variantResult.data as DashboardVariant[]) || []
  const leadList = (leadResult.data as DashboardLead[]) || []
  const bookingList = (bookingResult.data as DashboardBooking[]) || []

  const ordersToday = orderList.filter((order) => inRange(order.created_at, dayStart, dayEnd))
  const ordersThisWeek = orderList.filter((order) => inRange(order.created_at, weekStart, dayEnd))
  const ordersThisMonth = orderList.filter((order) => inRange(order.created_at, monthStart, dayEnd))

  const revenueToday = ordersToday.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)
  const revenueThisWeek = ordersThisWeek.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)
  const revenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)

  const customersToday = customerList.filter((customer) => inRange(customer.created_at, dayStart, dayEnd)).length
  const customersThisWeek = customerList.filter((customer) => inRange(customer.created_at, weekStart, dayEnd)).length
  const customersThisMonth = customerList.filter((customer) => inRange(customer.created_at, monthStart, dayEnd)).length

  const leadsToday = leadList.filter((lead) => inRange(lead.created_at, dayStart, dayEnd)).length
  const newOrUnassignedLeads = leadList.filter((lead) => {
    const status = (lead.status || "").toLowerCase()
    return status === "new" || !lead.owner_user_id
  }).length

  const bookingsToday = bookingList.filter((booking) =>
    inRange(booking.scheduled_start_at || booking.created_at, dayStart, dayEnd)
  ).length
  const pendingBookings = bookingList.filter((booking) => (booking.status || "").toLowerCase() === "pending").length

  const upcomingBookings = bookingList
    .filter((booking) => {
      const scheduledAt = toDate(booking.scheduled_start_at)
      return Boolean(scheduledAt && scheduledAt.getTime() >= dayStart.getTime())
    })
    .sort((a, b) => new Date(a.scheduled_start_at).getTime() - new Date(b.scheduled_start_at).getTime())
    .slice(0, 8)

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
    {
      id: "unassigned_or_new_leads",
      title: "Unassigned or new leads",
      value: newOrUnassignedLeads,
    },
    {
      id: "pending_bookings",
      title: "Pending bookings",
      value: pendingBookings,
    },
  ]

  const leadsSeries = buildDailySeries(7, now, (lead: DashboardLead) => lead.created_at, leadList)
  const bookingsSeries = buildDailySeries(7, now, (booking: DashboardBooking) => booking.scheduled_start_at, bookingList)
  const revenueSeries = buildDailySeries(
    30,
    now,
    (order: DashboardOrder) => order.created_at,
    orderList,
    (order: DashboardOrder) => toMoneyAmount(order.total)
  )

  res.json({
    generated_at: now.toISOString(),
    currency_code: orderList.find((order) => order.currency_code)?.currency_code || null,
    timezone: "UTC",
    revenue: {
      today: revenueToday,
      this_week: revenueThisWeek,
      this_month: revenueThisMonth,
    },
    leads: {
      total: leadList.length,
      new_today: leadsToday,
      recent: leadList.slice(0, 10),
    },
    bookings: {
      total: bookingList.length,
      today: bookingsToday,
      pending: pendingBookings,
      upcoming: upcomingBookings.map((booking) => ({
        id: booking.id,
        reference: booking.reference,
        customer_full_name: booking.customer_full_name,
        customer_email: booking.customer_email,
        status: booking.status,
        scheduled_start_at: booking.scheduled_start_at,
        service_name: booking.service?.name || null,
      })),
    },
    orders: {
      total: orderList.length,
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
    customers: {
      total: customerList.length,
      today: customersToday,
      this_week: customersThisWeek,
      this_month: customersThisMonth,
    },
    carts: {
      open_count: cartList.length,
    },
    statuses: {
      refunded_orders: refundedOrders,
      pending_fulfillment: pendingFulfillment,
      unpaid_orders: unpaidOrders,
    },
    charts: {
      leads_last_7_days: leadsSeries,
      bookings_last_7_days: bookingsSeries,
      revenue_last_30_days: revenueSeries,
    },
    operational_alerts: operationalAlerts,
  })
}
