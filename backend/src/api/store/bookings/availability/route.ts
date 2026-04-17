import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../../modules/booking"
import BookingModuleService from "../../../../modules/booking/service"

export const GetStoreBookingAvailabilitySchema = z.object({
  service_id: z.string(),
  date: z.string(),
  timezone: z.string().optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetStoreBookingAvailabilitySchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const slots = await bookingService.getAvailableSlots({
    service_id: req.validatedQuery.service_id as string,
    date: req.validatedQuery.date as string,
    timezone: req.validatedQuery.timezone as string | undefined,
  })

  res.json({ slots })
}
