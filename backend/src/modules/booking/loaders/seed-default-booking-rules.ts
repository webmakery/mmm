import { IMedusaInternalService, LoaderOptions } from "@medusajs/framework/types"
import BookingRule from "../models/booking-rule"
import BookingService from "../models/booking-service"

export default async function seedDefaultBookingRules({ container }: LoaderOptions) {
  const bookingRuleService: IMedusaInternalService<typeof BookingRule> = container.resolve("bookingRuleService")
  const bookingServiceService: IMedusaInternalService<typeof BookingService> = container.resolve("bookingServiceService")

  const [rules] = await bookingRuleService.listAndCount()
  if (rules.length === 0) {
    await bookingRuleService.create({
      minimum_notice_minutes: 60,
      maximum_days_in_advance: 60,
      cancellation_window_hours: 24,
      reschedule_window_hours: 12,
      same_day_booking_enabled: false,
      buffer_minutes: 15,
      timezone: "UTC",
    })
  }

  const [services] = await bookingServiceService.listAndCount()
  if (services.length === 0) {
    await bookingServiceService.create([
      {
        name: "Standard Consultation",
        description: "30 minute booking slot",
        duration_minutes: 30,
        availability_start_time: "09:00",
        availability_end_time: "17:00",
        timezone: "UTC",
        is_active: true,
      },
    ])
  }
}
