import { model } from "@medusajs/framework/utils"

const BookingRule = model.define("booking_rule", {
  id: model.id().primaryKey(),
  minimum_notice_minutes: model.number().default(60),
  maximum_days_in_advance: model.number().default(60),
  cancellation_window_hours: model.number().default(24),
  reschedule_window_hours: model.number().default(12),
  same_day_booking_enabled: model.boolean().default(false),
  buffer_minutes: model.number().default(15),
  blackout_dates: model.json().nullable(),
  timezone: model.text().default("UTC"),
})

export default BookingRule
