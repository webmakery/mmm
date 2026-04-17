import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import Booking from "./models/booking"
import BookingNotification from "./models/booking-notification"
import BookingRule from "./models/booking-rule"
import BookingService from "./models/booking-service"

export type BookingFilters = {
  date?: string
  status?: string
  service_id?: string
  customer?: string
}

const pad = (value: number) => `${value}`.padStart(2, "0")

const parseTimeToMinutes = (timeValue: string) => {
  const [hours, minutes] = timeValue.split(":").map((part) => Number(part))
  return (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0)
}

class BookingModuleService extends MedusaService({
  Booking,
  BookingService,
  BookingRule,
  BookingNotification,
}) {
  @InjectManager()
  async getOrCreateRules(@MedusaContext() sharedContext?: Context<EntityManager>) {
    const rules = await this.listBookingRules({}, {}, sharedContext)
    if (rules[0]) {
      return rules[0]
    }

    const created = await this.createBookingRules(
      {
        minimum_notice_minutes: 60,
        maximum_days_in_advance: 60,
        cancellation_window_hours: 24,
        reschedule_window_hours: 12,
        same_day_booking_enabled: false,
        buffer_minutes: 15,
        timezone: "UTC",
      },
      sharedContext
    )

    return created
  }

  @InjectManager()
  async listBookingsWithFilters(
    filters: BookingFilters,
    pagination: { limit: number; offset: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const values: unknown[] = []
    const whereClauses = ["b.deleted_at is null"]

    if (filters.status) {
      values.push(filters.status)
      whereClauses.push("b.status = ?")
    }

    if (filters.service_id) {
      values.push(filters.service_id)
      whereClauses.push("b.service_id = ?")
    }

    if (filters.customer) {
      values.push(`%${filters.customer}%`, `%${filters.customer}%`)
      whereClauses.push("(b.customer_full_name ilike ? or b.customer_email ilike ?)")
    }

    if (filters.date) {
      values.push(filters.date)
      whereClauses.push("date(b.scheduled_start_at) = ?")
    }

    const whereSql = whereClauses.join(" and ")

    const bookings = await manager?.execute(
      `
      select
        b.*,
        bs.name as service_name,
        bs.duration_minutes as service_duration_minutes
      from booking b
      left join booking_service bs on bs.id = b.service_id
      where ${whereSql}
      order by b.scheduled_start_at asc
      limit ? offset ?
      `,
      [...values, pagination.limit, pagination.offset]
    )

    const countResult = await manager?.execute(`select count(*)::int as count from booking b where ${whereSql}`, values)

    return {
      bookings: bookings || [],
      count: countResult?.[0]?.count || 0,
    }
  }

  @InjectManager()
  async hasBookingConflict(
    payload: { service_id: string; start_at: Date; end_at: Date; exclude_id?: string },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const values: unknown[] = [payload.service_id, payload.start_at.toISOString(), payload.end_at.toISOString()]
    const where = [
      "b.deleted_at is null",
      "b.service_id = ?",
      "b.status in ('pending', 'confirmed')",
      "b.scheduled_start_at < ?",
      "b.scheduled_end_at > ?",
    ]

    if (payload.exclude_id) {
      values.push(payload.exclude_id)
      where.push("b.id != ?")
    }

    const rows = await manager?.execute(
      `select b.id from booking b where ${where.join(" and ")} limit 1`,
      [values[0], values[2], values[1], ...values.slice(3)]
    )

    return Boolean(rows?.length)
  }

  @InjectManager()
  async getAvailableSlots(
    payload: { service_id: string; date: string; timezone?: string },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const service = await this.retrieveBookingService(payload.service_id, {}, sharedContext)
    const rules = await this.getOrCreateRules(sharedContext)

    const date = new Date(`${payload.date}T00:00:00.000Z`)
    const now = new Date()
    const dayDiff = Math.floor((date.getTime() - new Date(now.toISOString().slice(0, 10)).getTime()) / (24 * 60 * 60 * 1000))

    if (dayDiff < 0) {
      return []
    }

    if (!rules.same_day_booking_enabled && dayDiff === 0) {
      return []
    }

    if (dayDiff > rules.maximum_days_in_advance) {
      return []
    }

    const blackoutDates = ((rules.blackout_dates as { dates?: string[] } | null)?.dates || []) as string[]
    if (blackoutDates.includes(payload.date)) {
      return []
    }

    const startMinutes = parseTimeToMinutes(service.availability_start_time || "09:00")
    const endMinutes = parseTimeToMinutes(service.availability_end_time || "17:00")
    const slotStep = Math.max(15, service.duration_minutes + rules.buffer_minutes)

    const slots: string[] = []

    for (let minute = startMinutes; minute + service.duration_minutes <= endMinutes; minute += slotStep) {
      const hour = Math.floor(minute / 60)
      const minuteValue = minute % 60
      const startLabel = `${pad(hour)}:${pad(minuteValue)}`
      const startAt = new Date(`${payload.date}T${startLabel}:00.000Z`)

      if (startAt.getTime() - now.getTime() < rules.minimum_notice_minutes * 60 * 1000) {
        continue
      }

      const endAt = new Date(startAt.getTime() + service.duration_minutes * 60 * 1000)

      // eslint-disable-next-line no-await-in-loop
      const conflict = await this.hasBookingConflict(
        {
          service_id: payload.service_id,
          start_at: startAt,
          end_at: endAt,
        },
        sharedContext
      )

      if (!conflict) {
        slots.push(startLabel)
      }
    }

    return slots
  }

  @InjectManager()
  async createBookingWithValidation(
    payload: {
      service_id: string
      customer_full_name: string
      customer_email: string
      customer_phone?: string
      notes?: string
      scheduled_start_at: string
      timezone?: string
      metadata?: Record<string, unknown>
      status?: "pending" | "confirmed"
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const service = await this.retrieveBookingService(payload.service_id, {}, sharedContext)
    const startAt = new Date(payload.scheduled_start_at)
    const endAt = new Date(startAt.getTime() + service.duration_minutes * 60 * 1000)

    const hasConflict = await this.hasBookingConflict(
      {
        service_id: payload.service_id,
        start_at: startAt,
        end_at: endAt,
      },
      sharedContext
    )

    if (hasConflict) {
      throw new Error("Selected slot is no longer available")
    }

    const booking = await this.createBookings(
      {
        reference: `BK-${Date.now().toString().slice(-8).toUpperCase()}`,
        service_id: payload.service_id,
        customer_full_name: payload.customer_full_name,
        customer_email: payload.customer_email,
        customer_phone: payload.customer_phone,
        notes: payload.notes,
        status: payload.status || "pending",
        scheduled_start_at: startAt,
        scheduled_end_at: endAt,
        timezone: payload.timezone || service.timezone || "UTC",
        metadata: payload.metadata,
      },
      sharedContext
    )

    await this.createBookingNotifications(
      {
        booking_id: booking.id,
        type: "confirmation",
        channel: "feed",
        payload: {
          message: "Booking confirmation queued",
        },
      },
      sharedContext
    )

    return booking
  }

  @InjectManager()
  async updateBookingStatus(
    payload: { id: string; status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show" },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const updated = await this.updateBookings(
      {
        id: payload.id,
        status: payload.status,
        cancelled_at: payload.status === "cancelled" ? new Date() : null,
      },
      sharedContext
    )

    if (payload.status === "cancelled") {
      await this.createBookingNotifications(
        {
          booking_id: payload.id,
          type: "cancellation",
          channel: "feed",
          payload: { message: "Booking cancelled" },
        },
        sharedContext
      )
    }

    if (payload.status === "confirmed") {
      await this.createBookingNotifications(
        {
          booking_id: payload.id,
          type: "reminder",
          channel: "feed",
          payload: { message: "Reminder scheduled" },
        },
        sharedContext
      )
    }

    return updated
  }
}

export default BookingModuleService
