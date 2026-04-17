import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../../../modules/booking"
import BookingModuleService from "../../../../../modules/booking/service"

export const PostStoreRescheduleBookingSchema = z.object({
  scheduled_start_at: z.string().datetime(),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostStoreRescheduleBookingSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const current = await bookingService.retrieveBooking(req.params.id, {
    relations: ["service"],
  })

  const duration = current.service?.duration_minutes || 30
  const nextStartAt = new Date(req.validatedBody.scheduled_start_at)
  const nextEndAt = new Date(nextStartAt.getTime() + duration * 60 * 1000)

  const conflict = await bookingService.hasBookingConflict({
    service_id: current.service_id,
    start_at: nextStartAt,
    end_at: nextEndAt,
    exclude_id: current.id,
  })

  if (conflict) {
    throw new Error("Selected slot is no longer available")
  }

  const booking = await bookingService.updateBookings({
    id: req.params.id,
    scheduled_start_at: nextStartAt,
    scheduled_end_at: nextEndAt,
    status: "confirmed",
  })

  await bookingService.createBookingNotifications({
    booking_id: booking.id,
    type: "update",
    channel: "feed",
    payload: { message: "Booking rescheduled" },
  })

  res.json({ booking })
}
