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
    quantity?: number | null
    total?: number | null
  }> | null
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
    id?: string | null
    name?: string | null
  } | null
}

type DashboardVariant = {
  id: string
  title?: string | null
  inventory_quantity?: number | null
}

const toDate = (value?: string | null) => {
  if (!value) {
    return null
  }

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

const getPreviousUtcMonthStart = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1))

const inRange = (dateValue?: string | null, rangeStart?: Date, rangeEndExclusive?: Date) => {
  const date = toDate(dateValue)

  if (!date || !rangeStart || !rangeEndExclusive) {
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

const buildDailySeries = <TItem>(
  days: number,
  now: Date,
  getSourceDate: (item: TItem) => string | null | undefined,
  source: TItem[],
  getValue?: (item: TItem) => number
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
    const sourceDate = getSourceDate(item)
    const date = toDate(sourceDate)

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

const toPercent = (numerator: number, denominator: number) => {
  if (!denominator || denominator <= 0) {
    return 0
  }

  return (numerator / denominator) * 100
}

const getChangePercent = (current: number, previous: number) => {
  if (!previous) {
    return current > 0 ? 100 : 0
  }

  return ((current - previous) / previous) * 100
}

const roundTwo = (value: number) => Number(value.toFixed(2))

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const now = new Date()
  const dayStart = getUtcDayStart(now)
  const monthStart = getUtcMonthStart(now)
  const previousMonthStart = getPreviousUtcMonthStart(now)

  const [orderResult, customerResult, variantResult, leadResult, bookingResult] =
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
          "items.quantity",
          "items.total",
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
        fields: ["id"],
        pagination: {
          skip: 0,
          take: 500,
        },
      }),
      query.graph({
        entity: "product_variant",
        fields: ["id", "title", "inventory_quantity"],
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
          "service.id",
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
  const customerList = (customerResult.data as Array<{ id: string }>) || []
  const variantList = (variantResult.data as DashboardVariant[]) || []
  const leadList = (leadResult.data as DashboardLead[]) || []
  const bookingList = (bookingResult.data as DashboardBooking[]) || []

  const ordersThisMonth = orderList.filter((order) => inRange(order.created_at, monthStart, now))
  const ordersPreviousMonth = orderList.filter((order) => inRange(order.created_at, previousMonthStart, monthStart))

  const leadsThisMonth = leadList.filter((lead) => inRange(lead.created_at, monthStart, now))
  const leadsPreviousMonth = leadList.filter((lead) => inRange(lead.created_at, previousMonthStart, monthStart))

  const bookingsThisMonth = bookingList.filter((booking) =>
    inRange(booking.scheduled_start_at || booking.created_at, monthStart, now)
  )
  const bookingsPreviousMonth = bookingList.filter((booking) =>
    inRange(booking.scheduled_start_at || booking.created_at, previousMonthStart, monthStart)
  )

  const revenueThisMonth = ordersThisMonth.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)
  const revenuePreviousMonth = ordersPreviousMonth.reduce((sum, order) => sum + toMoneyAmount(order.total), 0)

  const avgOrderThisMonth = ordersThisMonth.length ? revenueThisMonth / ordersThisMonth.length : 0
  const avgOrderPreviousMonth = ordersPreviousMonth.length ? revenuePreviousMonth / ordersPreviousMonth.length : 0

  const unpaidOrderList = orderList.filter((order) => {
    const status = (order.payment_status || "").toLowerCase()
    return status === "awaiting" || status === "not_paid" || status === "partially_paid"
  })

  const unpaidAmountThisMonth = ordersThisMonth
    .filter((order) => unpaidOrderList.some((unpaid) => unpaid.id === order.id))
    .reduce((sum, order) => sum + toMoneyAmount(order.total), 0)

  const unpaidAmountPreviousMonth = ordersPreviousMonth
    .filter((order) => {
      const status = (order.payment_status || "").toLowerCase()
      return status === "awaiting" || status === "not_paid" || status === "partially_paid"
    })
    .reduce((sum, order) => sum + toMoneyAmount(order.total), 0)

  const conversionThisMonth = toPercent(bookingsThisMonth.length, leadsThisMonth.length)
  const conversionPreviousMonth = toPercent(bookingsPreviousMonth.length, leadsPreviousMonth.length)

  const unassignedLeads = leadList
    .filter((lead) => !lead.owner_user_id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const overdueFollowUps = leadList
    .filter((lead) => {
      if (!lead.next_follow_up_at) {
        return false
      }

      return (toDate(lead.next_follow_up_at)?.getTime() || 0) < now.getTime()
    })
    .sort((a, b) => new Date(a.next_follow_up_at || 0).getTime() - new Date(b.next_follow_up_at || 0).getTime())

  const lowStockVariants = variantList
    .filter((variant) => (variant.inventory_quantity || 0) <= 0)
    .slice(0, 3)

  const pendingConfirmations = bookingList
    .filter((booking) => {
      const status = (booking.status || "").toLowerCase()
      const bookingDate = toDate(booking.scheduled_start_at)
      if (!bookingDate) {
        return false
      }

      return status === "pending" && bookingDate.getTime() >= dayStart.getTime() && bookingDate.getTime() <= addUtcDays(dayStart, 7).getTime()
    })
    .sort((a, b) => new Date(a.scheduled_start_at).getTime() - new Date(b.scheduled_start_at).getTime())

  const urgentActionItems =
    unassignedLeads.length + overdueFollowUps.length + unpaidOrderList.length + lowStockVariants.length + pendingConfirmations.length

  const leadsSeries30 = buildDailySeries(30, now, (lead) => lead.created_at, leadList)
  const bookingsSeries30 = buildDailySeries(30, now, (booking) => booking.scheduled_start_at, bookingList)
  const revenueSeries30 = buildDailySeries(30, now, (order) => order.created_at, orderList, (order) => toMoneyAmount(order.total))

  const leadFunnelRaw = leadList.reduce((acc, lead) => {
    const stage = (lead.status || "new").toLowerCase()
    acc.set(stage, (acc.get(stage) || 0) + 1)
    return acc
  }, new Map<string, number>())

  const funnelByStage = Array.from(leadFunnelRaw.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([stage, count]) => ({
      stage,
      count,
      share: roundTwo(toPercent(count, leadList.length)),
      conversion_from_leads: roundTwo(toPercent(count, leadList.length)),
    }))

  const topProductsByRevenue = orderList.reduce((acc, order) => {
    ;(order.items || []).forEach((item) => {
      const key = (item.title || "Untitled item").trim() || "Untitled item"
      const revenue = toMoneyAmount(item.total)
      const quantity = item.quantity || 0
      const existing = acc.get(key) || { label: key, revenue: 0, bookings: 0 }
      existing.revenue += revenue
      existing.bookings += quantity
      acc.set(key, existing)
    })

    return acc
  }, new Map<string, { label: string; revenue: number; bookings: number }>())

  const topServicesByBookings = bookingList.reduce((acc, booking) => {
    const key = (booking.service?.name || "Unspecified service").trim() || "Unspecified service"
    const existing = acc.get(key) || { label: key, revenue: 0, bookings: 0 }
    existing.bookings += 1
    acc.set(key, existing)
    return acc
  }, new Map<string, { label: string; revenue: number; bookings: number }>())

  const topProducts = Array.from(topProductsByRevenue.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const topServices = Array.from(topServicesByBookings.values())
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5)

  const snapshotInsights = [
    {
      id: "revenue_momentum",
      title: "Revenue momentum",
      detail:
        getChangePercent(revenueThisMonth, revenuePreviousMonth) >= 0
          ? `Revenue is up ${Math.abs(roundTwo(getChangePercent(revenueThisMonth, revenuePreviousMonth)))}% vs previous month.`
          : `Revenue is down ${Math.abs(roundTwo(getChangePercent(revenueThisMonth, revenuePreviousMonth)))}% vs previous month.`,
    },
    {
      id: "conversion_health",
      title: "Lead conversion",
      detail:
        getChangePercent(conversionThisMonth, conversionPreviousMonth) >= 0
          ? `Lead-to-booking conversion improved by ${Math.abs(roundTwo(getChangePercent(conversionThisMonth, conversionPreviousMonth)))}% month over month.`
          : `Lead-to-booking conversion declined by ${Math.abs(roundTwo(getChangePercent(conversionThisMonth, conversionPreviousMonth)))}% month over month.`,
    },
    {
      id: "backlog_watch",
      title: "Lead backlog risk",
      detail:
        unassignedLeads.length > 0
          ? `${unassignedLeads.length} leads are unassigned and require owner assignment.`
          : "All leads currently have owners assigned.",
    },
    {
      id: "operations",
      title: "Operational stability",
      detail:
        pendingConfirmations.length > 0 || unpaidOrderList.length > 0
          ? `${pendingConfirmations.length + unpaidOrderList.length} operational exceptions need immediate follow-up.`
          : "No immediate operational exceptions detected.",
    },
  ]

  res.json({
    generated_at: now.toISOString(),
    timezone: "UTC",
    currency_code: orderList.find((order) => order.currency_code)?.currency_code || null,
    customers: {
      total: customerList.length,
    },
    executive_kpis: {
      revenue_this_month: {
        value: revenueThisMonth,
        previous: revenuePreviousMonth,
        change_percent: roundTwo(getChangePercent(revenueThisMonth, revenuePreviousMonth)),
      },
      bookings_this_month: {
        value: bookingsThisMonth.length,
        previous: bookingsPreviousMonth.length,
        change_percent: roundTwo(getChangePercent(bookingsThisMonth.length, bookingsPreviousMonth.length)),
      },
      lead_to_booking_conversion: {
        value: roundTwo(conversionThisMonth),
        previous: roundTwo(conversionPreviousMonth),
        change_percent: roundTwo(getChangePercent(conversionThisMonth, conversionPreviousMonth)),
      },
      average_order_value: {
        value: roundTwo(avgOrderThisMonth),
        previous: roundTwo(avgOrderPreviousMonth),
        change_percent: roundTwo(getChangePercent(avgOrderThisMonth, avgOrderPreviousMonth)),
      },
      unpaid_amount: {
        value: unpaidAmountThisMonth,
        previous: unpaidAmountPreviousMonth,
        change_percent: roundTwo(getChangePercent(unpaidAmountThisMonth, unpaidAmountPreviousMonth)),
        unpaid_orders: unpaidOrderList.length,
      },
      urgent_action_items: {
        value: urgentActionItems,
        previous: 0,
        change_percent: 0,
      },
    },
    snapshot_insights: snapshotInsights,
    performance: {
      revenue_trend_30_days: revenueSeries30,
      leads_vs_bookings_30_days: leadsSeries30.map((point, index) => ({
        date: point.date,
        label: point.label,
        leads: point.value,
        bookings: bookingsSeries30[index]?.value || 0,
      })),
      funnel_conversion_by_stage: funnelByStage,
      top_products_by_revenue: topProducts,
      top_services_by_bookings: topServices,
    },
    attention_required: {
      unassigned_leads: {
        value: unassignedLeads.length,
        preview: unassignedLeads.slice(0, 3).map((lead) => ({
          id: lead.id,
          label: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Unnamed lead",
          context: lead.company || "No company",
        })),
      },
      overdue_follow_ups: {
        value: overdueFollowUps.length,
        preview: overdueFollowUps.slice(0, 3).map((lead) => ({
          id: lead.id,
          label: [lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.email || "Unnamed lead",
          context: lead.next_follow_up_at || "",
        })),
      },
      unpaid_orders: {
        value: unpaidOrderList.length,
        preview: unpaidOrderList.slice(0, 3).map((order) => ({
          id: order.id,
          label: `#${order.display_id || order.id.slice(0, 8)}`,
          context: `${toMoneyAmount(order.total)}`,
        })),
      },
      low_stock: {
        value: lowStockVariants.length,
        preview: lowStockVariants.map((variant) => ({
          id: variant.id,
          label: variant.title || variant.id,
          context: `Inventory ${variant.inventory_quantity || 0}`,
        })),
      },
      upcoming_confirmations: {
        value: pendingConfirmations.length,
        preview: pendingConfirmations.slice(0, 3).map((booking) => ({
          id: booking.id,
          label: booking.reference || booking.customer_full_name || booking.id,
          context: booking.scheduled_start_at,
        })),
      },
    },
  })
}
