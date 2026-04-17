import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../../modules/booking"
import BookingModuleService from "../../../../modules/booking/service"

export const PostAdminUpdateBookingSchema = z.object({
  action: z.enum(["confirm", "cancel", "reschedule", "status"]),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  scheduled_start_at: z.string().datetime().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const booking = await bookingService.retrieveBooking(req.params.id, {
    relations: ["service"],
  })
  const notifications = await bookingService.listBookingNotifications({ booking_id: req.params.id })

  res.json({ booking, notifications })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminUpdateBookingSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)

  if (req.validatedBody.action === "reschedule") {
    const current = await bookingService.retrieveBooking(req.params.id, {
      relations: ["service"],
    })

    if (!req.validatedBody.scheduled_start_at) {
      throw new Error("scheduled_start_at is required for reschedule")
    }

    const serviceDuration = current.service?.duration_minutes || 30
    const nextStartAt = new Date(req.validatedBody.scheduled_start_at)
    const nextEndAt = new Date(nextStartAt.getTime() + serviceDuration * 60 * 1000)

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
    return
  }

  const status =
    req.validatedBody.action === "confirm"
      ? "confirmed"
      : req.validatedBody.action === "cancel"
      ? "cancelled"
      : req.validatedBody.status || "pending"

  const booking = await bookingService.updateBookingStatus({
    id: req.params.id,
    status,
  })

  res.json({ booking })
}
