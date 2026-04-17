import { LoaderOptions } from "@medusajs/framework/types"
import { BOOKING_MODULE } from ".."
import BookingModuleService from "../service"

export default async function seedDefaultBookingRules({ container }: LoaderOptions) {
  const bookingService: BookingModuleService = container.resolve(BOOKING_MODULE)

  const rules = await bookingService.listBookingRules()
  if (!rules.length) {
    await bookingService.createBookingRules({
      minimum_notice_minutes: 60,
      maximum_days_in_advance: 60,
      cancellation_window_hours: 24,
      reschedule_window_hours: 12,
      same_day_booking_enabled: false,
      buffer_minutes: 15,
      timezone: "UTC",
      blackout_dates: { dates: [] },
    })
  }

  const services = await bookingService.listBookingServices({})
  if (!services.length) {
    await bookingService.createBookingServices([
      {
        name: "Discovery Call",
        description: "30-minute discovery call",
        duration_minutes: 30,
        availability_start_time: "09:00",
        availability_end_time: "17:00",
        timezone: "UTC",
        is_active: true,
      },
      {
        name: "Implementation Session",
        description: "60-minute implementation session",
        duration_minutes: 60,
        availability_start_time: "10:00",
        availability_end_time: "18:00",
        timezone: "UTC",
        is_active: true,
      },
    ])
  }
}
