import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../modules/booking"
import BookingModuleService from "../../../modules/booking/service"

export const PostAdminBookingRulesSchema = z.object({
  minimum_notice_minutes: z.coerce.number().int().min(0).max(1440),
  maximum_days_in_advance: z.coerce.number().int().min(1).max(365),
  cancellation_window_hours: z.coerce.number().int().min(0).max(720),
  reschedule_window_hours: z.coerce.number().int().min(0).max(720),
  same_day_booking_enabled: z.boolean(),
  buffer_minutes: z.coerce.number().int().min(0).max(240),
  timezone: z.string().default("UTC"),
  blackout_dates: z.object({ dates: z.array(z.string()).default([]) }).optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const rules = await bookingService.getOrCreateRules()
  res.json({ rules })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminBookingRulesSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const current = await bookingService.getOrCreateRules()
  const rules = await bookingService.updateBookingRules({ id: current.id, ...req.validatedBody })

  res.json({ rules })
}
