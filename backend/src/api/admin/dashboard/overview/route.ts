import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

type DashboardOrder = {
  id: string
  customer_id?: string | null
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

type JourneyEvent = {
  id: string
  event_name: string
  occurred_at: string
  visitor_id?: string | null
  customer_id?: string | null
  normalized_source?: string | null
  utm_source?: string | null
}

type JourneyAttributionTouch = {
  id: string
  customer_id?: string | null
  visitor_id?: string | null
  touched_at: string
  touch_type: string
  source?: string | null
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

const normalizeEmail = (value?: string | null) => (value || "").trim().toLowerCase()

const getAverageHoursBetween = (pairs: Array<{ startAt: Date; endAt: Date }>) => {
  if (!pairs.length) {
    return 0
  }

  const totalMs = pairs.reduce((sum, pair) => sum + (pair.endAt.getTime() - pair.startAt.getTime()), 0)
  return roundTwo(totalMs / pairs.length / (1000 * 60 * 60))
}

const ensureSource = (value?: string | null) => {
  const output = (value || "").trim().toLowerCase()
  return output || "direct"
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const now = new Date()
  const dayStart = getUtcDayStart(now)
  const monthStart = getUtcMonthStart(now)
  const previousMonthStart = getPreviousUtcMonthStart(now)

  const [orderResult, customerResult, leadResult, bookingResult, journeyEventResult, touchResult] =
    await Promise.all([
      query.graph({
        entity: "order",
        fields: [
          "id",
          "customer_id",
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
      query.graph({
        entity: "journey_event",
        fields: ["id", "event_name", "occurred_at", "visitor_id", "customer_id", "normalized_source", "utm_source"],
        pagination: {
          order: {
            occurred_at: "DESC",
          },
          skip: 0,
          take: 5000,
        },
      }),
      query.graph({
        entity: "journey_attribution_touch",
        fields: ["id", "customer_id", "visitor_id", "touch_type", "source", "touched_at"],
        pagination: {
          order: {
            touched_at: "DESC",
          },
          skip: 0,
          take: 5000,
        },
      }),
    ])

  const orderList = (orderResult.data as DashboardOrder[]) || []
  const customerList = (customerResult.data as Array<{ id: string }>) || []
  const leadList = (leadResult.data as DashboardLead[]) || []
  const bookingList = (bookingResult.data as DashboardBooking[]) || []
  const journeyEvents = (journeyEventResult.data as JourneyEvent[]) || []
  const journeyTouches = (touchResult.data as JourneyAttributionTouch[]) || []

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

  const unassignedLeads = leadList.filter((lead) => !lead.owner_user_id)

  const overdueFollowUps = leadList.filter((lead) => {
    if (!lead.next_follow_up_at) {
      return false
    }

    return (toDate(lead.next_follow_up_at)?.getTime() || 0) < now.getTime()
  })

  const leadCount = leadList.length
  const qualifiedCount = leadList.filter((lead) => (lead.status || "").toLowerCase() === "qualified").length
  const bookingCount = bookingList.length
  const completedCount = bookingList.filter((booking) => (booking.status || "").toLowerCase() === "completed").length
  const paidCount = orderList.filter((order) => {
    const status = (order.payment_status || "").toLowerCase()
    return status === "paid" || status === "captured"
  }).length

  const toStage = (key: "leads" | "qualified" | "bookings" | "completed" | "paid", label: string, count: number, previousCount?: number, href?: string) => ({
    key,
    label,
    count,
    conversion_from_previous: previousCount ? roundTwo(toPercent(count, previousCount)) : 100,
    dropoff_from_previous: previousCount ? roundTwo(100 - toPercent(count, previousCount)) : 0,
    href: href || "/",
  })

  const funnelStages = [
    toStage("leads", "Leads", leadCount, undefined, "/leads"),
    toStage("qualified", "Qualified", qualifiedCount, leadCount, "/leads"),
    toStage("bookings", "Bookings", bookingCount, qualifiedCount, "/bookings"),
    toStage("completed", "Completed", completedCount, bookingCount, "/bookings"),
    toStage("paid", "Paid", paidCount, completedCount, "/orders"),
  ]

  const leadByEmail = leadList.reduce((acc, lead) => {
    const key = normalizeEmail(lead.email)
    if (!key) {
      return acc
    }

    const list = acc.get(key) || []
    list.push(lead)
    acc.set(key, list)
    return acc
  }, new Map<string, DashboardLead[]>())

  leadByEmail.forEach((entries) => entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))

  const bookingByEmail = bookingList.reduce((acc, booking) => {
    const key = normalizeEmail(booking.customer_email)
    if (!key) {
      return acc
    }

    const list = acc.get(key) || []
    list.push(booking)
    acc.set(key, list)
    return acc
  }, new Map<string, DashboardBooking[]>())

  bookingByEmail.forEach((entries) =>
    entries.sort((a, b) => new Date(a.created_at || a.scheduled_start_at).getTime() - new Date(b.created_at || b.scheduled_start_at).getTime())
  )

  const orderByEmail = orderList.reduce((acc, order) => {
    const key = normalizeEmail(order.email)
    if (!key) {
      return acc
    }

    const list = acc.get(key) || []
    list.push(order)
    acc.set(key, list)
    return acc
  }, new Map<string, DashboardOrder[]>())

  orderByEmail.forEach((entries) => entries.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))

  const leadToBookingPairs: Array<{ startAt: Date; endAt: Date }> = []
  const bookingToPaidPairs: Array<{ startAt: Date; endAt: Date }> = []

  bookingByEmail.forEach((bookings, email) => {
    const leads = leadByEmail.get(email) || []
    const paidOrders = (orderByEmail.get(email) || []).filter((order) => {
      const paymentStatus = (order.payment_status || "").toLowerCase()
      return paymentStatus === "paid" || paymentStatus === "captured"
    })

    bookings.forEach((booking) => {
      const bookingDate = toDate(booking.created_at || booking.scheduled_start_at)
      if (!bookingDate) {
        return
      }

      const leadMatch = [...leads]
        .reverse()
        .find((lead) => {
          const leadDate = toDate(lead.created_at)
          return leadDate ? leadDate.getTime() <= bookingDate.getTime() : false
        })

      const leadDate = toDate(leadMatch?.created_at)
      if (leadDate) {
        leadToBookingPairs.push({
          startAt: leadDate,
          endAt: bookingDate,
        })
      }

      const paidOrderMatch = paidOrders.find((order) => {
        const paidAt = toDate(order.created_at)
        return paidAt ? paidAt.getTime() >= bookingDate.getTime() : false
      })

      const paidDate = toDate(paidOrderMatch?.created_at)
      if (paidDate) {
        bookingToPaidPairs.push({
          startAt: bookingDate,
          endAt: paidDate,
        })
      }
    })
  })

  const leadToBookingCurrentWeek = toPercent(
    bookingList.filter((booking) => inRange(booking.created_at || booking.scheduled_start_at, addUtcDays(dayStart, -7), now)).length,
    leadList.filter((lead) => inRange(lead.created_at, addUtcDays(dayStart, -7), now)).length
  )
  const leadToBookingPreviousWeek = toPercent(
    bookingList.filter((booking) => inRange(booking.created_at || booking.scheduled_start_at, addUtcDays(dayStart, -14), addUtcDays(dayStart, -7))).length,
    leadList.filter((lead) => inRange(lead.created_at, addUtcDays(dayStart, -14), addUtcDays(dayStart, -7))).length
  )

  const bookingToPaidCurrentWeek = toPercent(
    orderList.filter((order) => {
      const status = (order.payment_status || "").toLowerCase()
      return (status === "paid" || status === "captured") && inRange(order.created_at, addUtcDays(dayStart, -7), now)
    }).length,
    bookingList.filter((booking) => inRange(booking.created_at || booking.scheduled_start_at, addUtcDays(dayStart, -7), now)).length
  )
  const bookingToPaidPreviousWeek = toPercent(
    orderList.filter((order) => {
      const status = (order.payment_status || "").toLowerCase()
      return (status === "paid" || status === "captured") && inRange(order.created_at, addUtcDays(dayStart, -14), addUtcDays(dayStart, -7))
    }).length,
    bookingList.filter((booking) =>
      inRange(booking.created_at || booking.scheduled_start_at, addUtcDays(dayStart, -14), addUtcDays(dayStart, -7))
    ).length
  )

  const bookingToPaidCurrentMonth = toPercent(
    orderList.filter((order) => {
      const status = (order.payment_status || "").toLowerCase()
      return (status === "paid" || status === "captured") && inRange(order.created_at, monthStart, now)
    }).length,
    bookingsThisMonth.length
  )
  const bookingToPaidPreviousMonth = toPercent(
    orderList.filter((order) => {
      const status = (order.payment_status || "").toLowerCase()
      return (status === "paid" || status === "captured") && inRange(order.created_at, previousMonthStart, monthStart)
    }).length,
    bookingsPreviousMonth.length
  )

  const highestDropOffStage = funnelStages.slice(1).sort((a, b) => b.dropoff_from_previous - a.dropoff_from_previous)[0]
  const funnelInsights: Array<{ id: string; detail: string }> = []

  if (highestDropOffStage && highestDropOffStage.dropoff_from_previous > 0) {
    funnelInsights.push({
      id: "biggest_dropoff",
      detail: `Largest drop-off is at ${highestDropOffStage.label.toLowerCase()} (${highestDropOffStage.dropoff_from_previous}% lost from prior stage).`,
    })
  }

  funnelInsights.push({
    id: "lead_to_booking_trend",
    detail:
      roundTwo(getChangePercent(leadToBookingCurrentWeek, leadToBookingPreviousWeek)) >= 0
        ? `Lead-to-booking conversion is up ${Math.abs(roundTwo(getChangePercent(leadToBookingCurrentWeek, leadToBookingPreviousWeek)))}% week over week.`
        : `Lead-to-booking conversion is down ${Math.abs(roundTwo(getChangePercent(leadToBookingCurrentWeek, leadToBookingPreviousWeek)))}% week over week.`,
  })

  funnelInsights.push({
    id: "booking_to_paid_trend",
    detail:
      roundTwo(getChangePercent(bookingToPaidCurrentMonth, bookingToPaidPreviousMonth)) >= 0
        ? `Booking-to-paid conversion improved ${Math.abs(roundTwo(getChangePercent(bookingToPaidCurrentMonth, bookingToPaidPreviousMonth)))}% month over month.`
        : `Booking-to-paid conversion declined ${Math.abs(roundTwo(getChangePercent(bookingToPaidCurrentMonth, bookingToPaidPreviousMonth)))}% month over month.`,
  })

  if (leadToBookingPairs.length > 0 || bookingToPaidPairs.length > 0) {
    funnelInsights.push({
      id: "cycle_time",
      detail: `Average cycle time is ${roundTwo(getAverageHoursBetween(leadToBookingPairs))}h from lead to booking and ${roundTwo(getAverageHoursBetween(bookingToPaidPairs))}h from booking to payment.`,
    })
  }

  const urgentActionItems = unassignedLeads.length + overdueFollowUps.length + unpaidOrderList.length

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

  const attributionByModel = {
    first_touch: {
      customer: new Map<string, { source: string; touchedAt: number }>(),
      visitor: new Map<string, { source: string; touchedAt: number }>(),
    },
    last_touch: {
      customer: new Map<string, { source: string; touchedAt: number }>(),
      visitor: new Map<string, { source: string; touchedAt: number }>(),
    },
  }

  journeyTouches.forEach((touch) => {
    const touchType = touch.touch_type === "first_touch" ? "first_touch" : touch.touch_type === "last_touch" ? "last_touch" : null
    if (!touchType) {
      return
    }

    const touchedAt = toDate(touch.touched_at)?.getTime() || 0
    const source = ensureSource(touch.source)
    const customerId = (touch.customer_id || "").trim()
    const visitorId = (touch.visitor_id || "").trim()

    if (customerId) {
      const existing = attributionByModel[touchType].customer.get(customerId)
      const shouldReplace = !existing || (touchType === "first_touch" ? touchedAt < existing.touchedAt : touchedAt > existing.touchedAt)
      if (shouldReplace) {
        attributionByModel[touchType].customer.set(customerId, { source, touchedAt })
      }
    }

    if (visitorId) {
      const existing = attributionByModel[touchType].visitor.get(visitorId)
      const shouldReplace = !existing || (touchType === "first_touch" ? touchedAt < existing.touchedAt : touchedAt > existing.touchedAt)
      if (shouldReplace) {
        attributionByModel[touchType].visitor.set(visitorId, { source, touchedAt })
      }
    }
  })

  const toAttributionKey = (event: { customer_id?: string | null; visitor_id?: string | null }) =>
    event.customer_id || event.visitor_id || ""

  const channelPerformanceByModel = (["first_touch", "last_touch"] as const).reduce(
    (output, model) => {
      const bySource = new Map<
        string,
        {
          visitors: Set<string>
          engaged_visitors: Set<string>
          signups: Set<string>
          checkout_starts: Set<string>
          purchases: number
          revenue: number
        }
      >()

      const customerEventSource = new Map<string, { source: string; occurredAt: number }>()

      const getSourceForEvent = (event: JourneyEvent) =>
        attributionByModel[model].customer.get(event.customer_id || "")?.source ||
        attributionByModel[model].visitor.get(event.visitor_id || "")?.source ||
        ensureSource(event.normalized_source || event.utm_source)

      const ensureEntry = (source: string) => {
        const key = ensureSource(source)
        const existing = bySource.get(key)
        if (existing) {
          return existing
        }

        const created = {
          visitors: new Set<string>(),
          engaged_visitors: new Set<string>(),
          signups: new Set<string>(),
          checkout_starts: new Set<string>(),
          purchases: 0,
          revenue: 0,
        }
        bySource.set(key, created)
        return created
      }

      journeyEvents.forEach((event) => {
        const source = getSourceForEvent(event)
        const entry = ensureEntry(source)
        const visitorId = (event.visitor_id || "").trim()
        const identityKey = toAttributionKey(event).trim()

        if (visitorId) {
          entry.visitors.add(visitorId)
        }

        if (event.event_name === "engaged_visit_5s" && visitorId) {
          entry.engaged_visitors.add(visitorId)
        }

        if (event.event_name === "signup_completed" && identityKey) {
          entry.signups.add(identityKey)
        }

        if (event.event_name === "checkout_started" && identityKey) {
          entry.checkout_starts.add(identityKey)
        }

        const customerId = (event.customer_id || "").trim()
        const occurredAt = toDate(event.occurred_at)?.getTime() || 0
        if (customerId) {
          const existing = customerEventSource.get(customerId)
          const shouldReplace =
            !existing ||
            (model === "first_touch"
              ? occurredAt < existing.occurredAt
              : occurredAt > existing.occurredAt)

          if (shouldReplace) {
            customerEventSource.set(customerId, { source, occurredAt })
          }
        }
      })

      orderList
        .filter((order) => {
          const status = (order.payment_status || "").toLowerCase()
          return status === "paid" || status === "captured"
        })
        .forEach((order) => {
          const source =
            attributionByModel[model].customer.get(order.customer_id || "")?.source ||
            customerEventSource.get((order.customer_id || "").trim())?.source ||
            "direct"
          const entry = ensureEntry(source)
          entry.purchases += 1
          entry.revenue += toMoneyAmount(order.total)
        })

      const rows = Array.from(bySource.entries())
        .map(([source, entry]) => {
          const visitors = entry.visitors.size
          const engagedVisitors = entry.engaged_visitors.size
          const signups = entry.signups.size
          const checkoutStarts = entry.checkout_starts.size
          const purchases = entry.purchases
          const revenue = entry.revenue

          return {
            source,
            visitors,
            engaged_visitors: engagedVisitors,
            signups,
            checkout_starts: checkoutStarts,
            purchases,
            revenue,
            signup_rate: roundTwo(toPercent(signups, visitors)),
            checkout_rate: roundTwo(toPercent(checkoutStarts, signups)),
            purchase_rate: roundTwo(toPercent(purchases, checkoutStarts)),
            aov: purchases > 0 ? roundTwo(revenue / purchases) : 0,
          }
        })
        .sort((a, b) => b.revenue - a.revenue || b.purchases - a.purchases || b.visitors - a.visitors)

      output[model] = rows
      return output
    },
    {
      first_touch: [] as Array<{
        source: string
        visitors: number
        engaged_visitors: number
        signups: number
        checkout_starts: number
        purchases: number
        revenue: number
        signup_rate: number
        checkout_rate: number
        purchase_rate: number
        aov: number
      }>,
      last_touch: [] as Array<{
        source: string
        visitors: number
        engaged_visitors: number
        signups: number
        checkout_starts: number
        purchases: number
        revenue: number
        signup_rate: number
        checkout_rate: number
        purchase_rate: number
        aov: number
      }>,
    }
  )

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
        overdueFollowUps.length > 0 || unpaidOrderList.length > 0
          ? `${overdueFollowUps.length + unpaidOrderList.length} operational exceptions need immediate follow-up.`
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
    operational_risks: {
      unassigned_leads: unassignedLeads.length,
      overdue_follow_ups: overdueFollowUps.length,
      unpaid_orders: unpaidOrderList.length,
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
      channel_performance: channelPerformanceByModel,
    },
    full_funnel: {
      stages: funnelStages,
      derived_metrics: {
        lead_to_booking_conversion: roundTwo(toPercent(bookingCount, leadCount)),
        booking_to_paid_conversion: roundTwo(toPercent(paidCount, bookingCount)),
        overall_funnel_conversion: roundTwo(toPercent(paidCount, leadCount)),
        average_hours_lead_to_booking: getAverageHoursBetween(leadToBookingPairs),
        average_hours_booking_to_payment: getAverageHoursBetween(bookingToPaidPairs),
      },
      period_comparison: {
        week: {
          lead_to_booking_change_percent: roundTwo(getChangePercent(leadToBookingCurrentWeek, leadToBookingPreviousWeek)),
          booking_to_paid_change_percent: roundTwo(getChangePercent(bookingToPaidCurrentWeek, bookingToPaidPreviousWeek)),
        },
        month: {
          lead_to_booking_change_percent: roundTwo(getChangePercent(conversionThisMonth, conversionPreviousMonth)),
          booking_to_paid_change_percent: roundTwo(getChangePercent(bookingToPaidCurrentMonth, bookingToPaidPreviousMonth)),
        },
      },
      insights: funnelInsights.slice(0, 4),
    },
  })
}
