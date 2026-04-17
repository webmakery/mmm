import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../../modules/booking"
import BookingModuleService from "../../../../modules/booking/service"

export const PostAdminBookingServiceUpdateSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(5).max(600).optional(),
  availability_start_time: z.string().optional(),
  availability_end_time: z.string().optional(),
  timezone: z.string().optional(),
  price: z.coerce.number().nullable().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const service = await bookingService.retrieveBookingService(req.params.id)

  res.json({ service })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminBookingServiceUpdateSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const service = await bookingService.updateBookingServices({
    id: req.params.id,
    ...req.validatedBody,
  })

  res.json({ service })
}
