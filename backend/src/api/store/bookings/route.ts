import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../modules/booking"
import BookingModuleService from "../../../modules/booking/service"

export const PostStoreCreateBookingSchema = z.object({
  service_id: z.string(),
  customer_full_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
  scheduled_start_at: z.string().datetime(),
  timezone: z.string().optional(),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostStoreCreateBookingSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const booking = await bookingService.createBookingWithValidation(req.validatedBody)

  res.json({ booking })
}
