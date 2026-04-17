import { model } from "@medusajs/framework/utils"
import Booking from "./booking"

const BookingService = model.define("booking_service", {
  id: model.id().primaryKey(),
  name: model.text().index("IDX_BOOKING_SERVICE_NAME"),
  description: model.text().nullable(),
  duration_minutes: model.number().default(30),
  availability_start_time: model.text().default("09:00"),
  availability_end_time: model.text().default("17:00"),
  timezone: model.text().default("UTC"),
  price: model.bigNumber().nullable(),
  is_active: model.boolean().default(true),
  bookings: model.hasMany(() => Booking, {
    mappedBy: "service",
  }),
})

export default BookingService
