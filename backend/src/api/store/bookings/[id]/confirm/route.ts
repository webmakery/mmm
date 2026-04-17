import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { BOOKING_MODULE } from "../../../../../modules/booking"
import BookingModuleService from "../../../../../modules/booking/service"

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const bookingService: BookingModuleService = req.scope.resolve(BOOKING_MODULE)
  const booking = await bookingService.updateBookingStatus({
    id: req.params.id,
    status: "confirmed",
  })

  res.json({ booking })
}
