import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../modules/booking"
import BookingModuleService from "../../../modules/booking/service"

export const GetStoreBookingServicesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetStoreBookingServicesSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const services = await bookingService.listBookingServices(
    {
      is_active: true,
    },
    {
      take: req.validatedQuery.limit,
      skip: req.validatedQuery.offset,
      order: { created_at: "DESC" },
    }
  )

  res.json({ services })
}
