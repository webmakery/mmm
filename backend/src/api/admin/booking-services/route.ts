import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../modules/booking"
import BookingModuleService from "../../../modules/booking/service"

export const GetAdminBookingServicesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(100),
  offset: z.coerce.number().min(0).default(0),
  q: z.string().optional(),
})

export const PostAdminBookingServiceSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(5).max(600),
  availability_start_time: z.string().default("09:00"),
  availability_end_time: z.string().default("17:00"),
  timezone: z.string().default("UTC"),
  price: z.coerce.number().optional(),
  is_active: z.boolean().optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminBookingServicesSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const services = await bookingService.listBookingServices(
    req.validatedQuery.q
      ? {
          name: req.validatedQuery.q,
        }
      : {},
    {
      take: req.validatedQuery.limit,
      skip: req.validatedQuery.offset,
      order: { created_at: "DESC" },
    }
  )

  res.json({ services })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminBookingServiceSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const service = await bookingService.createBookingServices(req.validatedBody)

  res.json({ service })
}
