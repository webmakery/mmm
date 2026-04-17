import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { BOOKING_MODULE } from "../../../modules/booking"
import BookingModuleService from "../../../modules/booking/service"

export const GetAdminBookingsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
  date: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  service_id: z.string().optional(),
  customer: z.string().optional(),
})

export const PostAdminCreateBookingSchema = z.object({
  service_id: z.string(),
  customer_full_name: z.string().min(1),
  customer_email: z.string().email(),
  customer_phone: z.string().optional(),
  notes: z.string().optional(),
  scheduled_start_at: z.string().datetime(),
  timezone: z.string().default("UTC"),
  status: z.enum(["pending", "confirmed"]).optional(),
})

export async function GET(req: MedusaRequest<z.infer<typeof GetAdminBookingsSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)

  const result = await bookingService.listBookingsWithFilters(
    {
      date: req.validatedQuery.date as string | undefined,
      status: req.validatedQuery.status as string | undefined,
      service_id: req.validatedQuery.service_id as string | undefined,
      customer: req.validatedQuery.customer as string | undefined,
    },
    {
      limit: Number(req.validatedQuery.limit || 50),
      offset: Number(req.validatedQuery.offset || 0),
    }
  )

  res.json(result)
}

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminCreateBookingSchema>>, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const booking = await bookingService.createBookingWithValidation(req.validatedBody)

  res.json({ booking })
}
