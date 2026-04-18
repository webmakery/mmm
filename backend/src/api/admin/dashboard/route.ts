import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"

type DashboardOrder = {
  id: string
  display_id?: number
  created_at: string
  status?: string
  payment_status?: string
  fulfillment_status?: string
  total?: number
  currency_code?: string
  email?: string
  customer_id?: string
  canceled_at?: string | null
  items?: Array<{
    id: string
    title?: string
    quantity?: number
    total?: number
  }>
}

type DashboardCustomer = {
  id: string
  email?: string
  created_at: string
}

type DashboardLead = {
  id: string
  first_name?: string
  last_name?: string
  email?: string
  status?: string
  source?: string
  created_at: string
  updated_at?: string
  next_follow_up_at?: string
  activities?: Array<{
    id: string
    type?: string
    content?: string
    created_at: string
  }>
}

const dashboardPresets = ["today", "7d", "30d", "90d", "custom"] as const

export const GetAdminDashboardSchema = z
  .object({
    preset: z.enum(dashboardPresets).default("30d"),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .refine((input) => (input.preset === "custom" ? Boolean(input.from && input.to) : true), {
    message: "from and to are required when preset is custom",
    path: ["from"],
  })

const ONE_DAY_MS = 24 * 60 * 60 * 1000

const toDateKey = (value: Date) => value.toISOString().slice(0, 10)

const toStartOfDayUtc = (value: Date) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))

const buildRange = (preset: z.infer<typeof GetAdminDashboardSchema>["preset"], from?: string, to?: string) => {
  const now = new Date()
  const todayStart = toStartOfDayUtc(now)

  if (preset === "custom" && from && to) {
    const customFrom = toStartOfDayUtc(new Date(from))
    const customTo = toStartOfDayUtc(new Date(to))
    return {
      from: customFrom,
      to: new Date(customTo.getTime() + ONE_DAY_MS - 1),
      previousFrom: new Date(customFrom.getTime() - (customTo.getTime() - customFrom.getTime() + ONE_DAY_MS)),
      previousTo: new Date(customFrom.getTime() - 1),
    }
  }

  const days = preset === "today" ? 1 : preset === "7d" ? 7 : preset === "90d" ? 90 : 30
  const periodStart = new Date(todayStart.getTime() - (days - 1) * ONE_DAY_MS)

  return {
    from: periodStart,
    to: new Date(todayStart.getTime() + ONE_DAY_MS - 1),
    previousFrom: new Date(periodStart.getTime() - days * ONE_DAY_MS),
    previousTo: new Date(periodStart.getTime() - 1),
  }
}

const toAmount = (value?: number) => (typeof value === "number" ? value / 100 : 0)

const growth = (current: number, previous: number) => {
  if (previous <= 0) {
    return current > 0 ? 100 : 0
  }

  return ((current - previous) / previous) * 100
}

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminDashboardSchema>>, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const preset = req.validatedQuery.preset as z.infer<typeof GetAdminDashboardSchema>["preset"]
  const range = buildRange(preset, req.validatedQuery.from as string | undefined, req.validatedQuery.to as string | undefined)

  const [{ data: orders }, { data: customers }, { data: leads }] = await Promise.all([
    query.graph({
      entity: "order",
      fields: [
        "id",
        "display_id",
        "created_at",
        "status",
        "payment_status",
        "fulfillment_status",
        "total",
        "currency_code",
        "email",
        "customer_id",
        "canceled_at",
        "items.id",
        "items.title",
        "items.quantity",
        "items.total",
      ],
      filters: {
        created_at: {
          $gte: range.previousFrom,
          $lte: range.to,
        },
      },
      pagination: {
        skip: 0,
        take: 2000,
      },
    }),
    query.graph({
      entity: "customer",
      fields: ["id", "email", "created_at"],
      filters: {
        created_at: {
          $gte: range.previousFrom,
          $lte: range.to,
        },
      },
      pagination: {
        skip: 0,
        take: 2000,
      },
    }),
    query.graph({
      entity: "lead",
      fields: [
        "id",
        "first_name",
        "last_name",
        "email",
        "status",
        "source",
        "created_at",
        "updated_at",
        "next_follow_up_at",
        "activities.id",
        "activities.type",
        "activities.content",
        "activities.created_at",
      ],
      filters: {
        created_at: {
          $gte: range.previousFrom,
          $lte: range.to,
        },
      },
      pagination: {
        skip: 0,
        take: 2000,
      },
    }),
  ])

  const allOrders = (orders || []) as DashboardOrder[]
  const allCustomers = (customers || []) as DashboardCustomer[]
  const allLeads = (leads || []) as DashboardLead[]

  const inCurrentRange = (value?: string | null) => {
    if (!value) {
      return false
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return false
    }

    return date >= range.from && date <= range.to
  }

  const inPreviousRange = (value?: string | null) => {
    if (!value) {
      return false
    }

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return false
    }

    return date >= range.previousFrom && date <= range.previousTo
  }

  const currentOrders = allOrders.filter((order) => inCurrentRange(order.created_at))
  const previousOrders = allOrders.filter((order) => inPreviousRange(order.created_at))

  const currentCustomers = allCustomers.filter((customer) => inCurrentRange(customer.created_at))
  const previousCustomers = allCustomers.filter((customer) => inPreviousRange(customer.created_at))

  const currentLeads = allLeads.filter((lead) => inCurrentRange(lead.created_at))

  const grossSales = currentOrders.reduce((acc, order) => acc + toAmount(order.total), 0)
  const previousGrossSales = previousOrders.reduce((acc, order) => acc + toAmount(order.total), 0)

  const cancelledOrders = currentOrders.filter((order) => order.status === "canceled" || Boolean(order.canceled_at))
  const netSales = grossSales - cancelledOrders.reduce((acc, order) => acc + toAmount(order.total), 0)

  const averageOrderValue = currentOrders.length ? grossSales / currentOrders.length : 0

  const trendMap = new Map<string, { date: string; revenue: number; orders: number; cancelled: number }>()

  for (let cursor = new Date(range.from); cursor <= range.to; cursor = new Date(cursor.getTime() + ONE_DAY_MS)) {
    const key = toDateKey(cursor)
    trendMap.set(key, { date: key, revenue: 0, orders: 0, cancelled: 0 })
  }

  for (const order of currentOrders) {
    const key = toDateKey(new Date(order.created_at))
    const bucket = trendMap.get(key)
    if (!bucket) {
      continue
    }

    bucket.orders += 1
    bucket.revenue += toAmount(order.total)
    if (order.status === "canceled" || order.canceled_at) {
      bucket.cancelled += 1
    }
  }

  const productTotals = new Map<string, { title: string; revenue: number; quantity: number }>()

  for (const order of currentOrders) {
    for (const item of order.items || []) {
      const key = item.title || "Untitled product"
      const existing = productTotals.get(key)

      if (existing) {
        existing.revenue += toAmount(item.total)
        existing.quantity += item.quantity || 0
      } else {
        productTotals.set(key, {
          title: key,
          revenue: toAmount(item.total),
          quantity: item.quantity || 0,
        })
      }
    }
  }

  const statusTotals = currentOrders.reduce<Record<string, number>>((acc, order) => {
    const key = order.status || "pending"
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const currentPeriodDays = Math.max(1, Math.round((range.to.getTime() - range.from.getTime() + 1) / ONE_DAY_MS))
  const previousPeriodDays = Math.max(1, Math.round((range.previousTo.getTime() - range.previousFrom.getTime() + 1) / ONE_DAY_MS))

  const currentCancellationRate = currentOrders.length ? cancelledOrders.length / currentOrders.length : 0
  const previousCancelledOrders = previousOrders.filter((order) => order.status === "canceled" || order.canceled_at)
  const previousCancellationRate = previousOrders.length ? previousCancelledOrders.length / previousOrders.length : 0

  const leadsNeedingFollowUp = currentLeads.filter((lead) => {
    if (!lead.next_follow_up_at) {
      return false
    }

    const followUpDate = new Date(lead.next_follow_up_at)
    return followUpDate <= new Date() && lead.status !== "won" && lead.status !== "lost"
  })

  const alerts = [
    {
      id: "cancellation-rate",
      level: currentCancellationRate > 0.2 ? "high" : currentCancellationRate > 0.1 ? "medium" : "low",
      title: "Cancellation volume",
      description: `${(currentCancellationRate * 100).toFixed(1)}% of orders are cancelled in the selected period.`,
      action: "Review fulfillment, payment, and customer support workflows.",
    },
    {
      id: "payment-failures",
      level: currentOrders.some((order) => order.payment_status === "canceled") ? "medium" : "low",
      title: "Payment issues",
      description: `${currentOrders.filter((order) => order.payment_status === "canceled").length} orders show canceled payment status.`,
      action: "Check payment provider logs and retry options.",
    },
    {
      id: "lead-follow-up",
      level: leadsNeedingFollowUp.length > 0 ? "medium" : "low",
      title: "Lead follow-up",
      description: `${leadsNeedingFollowUp.length} leads require immediate follow-up.`,
      action: "Use CRM pipeline to assign and contact these leads.",
    },
  ]

  const recentLeadActivities = currentLeads
    .flatMap((lead) =>
      (lead.activities || []).map((activity) => ({
        id: activity.id,
        lead_id: lead.id,
        lead_name: [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim() || "Unnamed lead",
        type: activity.type || "note",
        content: activity.content || "",
        created_at: activity.created_at,
      }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)

  const recentOrders = [...currentOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10)
    .map((order) => ({
      id: order.id,
      display_id: order.display_id,
      created_at: order.created_at,
      total: toAmount(order.total),
      currency_code: order.currency_code || "usd",
      status: order.status || "pending",
      payment_status: order.payment_status || "unknown",
      email: order.email,
    }))

  res.json({
    filters: {
      preset,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      previous_from: range.previousFrom.toISOString(),
      previous_to: range.previousTo.toISOString(),
    },
    kpis: {
      gross_sales: grossSales,
      net_sales: netSales,
      orders: currentOrders.length,
      cancelled_orders: cancelledOrders.length,
      new_customers: currentCustomers.length,
      new_leads: currentLeads.length,
      average_order_value: averageOrderValue,
      comparisons: {
        gross_sales_change_pct: growth(grossSales, previousGrossSales),
        orders_change_pct: growth(currentOrders.length, previousOrders.length),
        customers_change_pct: growth(currentCustomers.length, previousCustomers.length),
        cancellation_rate_change_pct: growth(currentCancellationRate, previousCancellationRate),
      },
    },
    trends: {
      daily: Array.from(trendMap.values()),
      current_period_days: currentPeriodDays,
      previous_period_days: previousPeriodDays,
    },
    breakdowns: {
      sales_by_status: statusTotals,
      top_products: Array.from(productTotals.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8),
    },
    lists: {
      recent_orders: recentOrders,
      recent_customer_activity: currentCustomers
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
        .map((customer) => ({
          id: customer.id,
          email: customer.email,
          created_at: customer.created_at,
          type: "customer.created",
        })),
      recent_lead_activity: recentLeadActivities,
    },
    alerts,
  })
}
