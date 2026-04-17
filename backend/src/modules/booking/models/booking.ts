import { model } from "@medusajs/framework/utils"
import BookingService from "./booking-service"

export const BookingStatuses = ["pending", "confirmed", "cancelled", "completed", "no_show"]

const Booking = model.define("booking", {
  id: model.id().primaryKey(),
  reference: model.text().index("IDX_BOOKING_REFERENCE"),
  service: model.belongsTo(() => BookingService, {
    mappedBy: "bookings",
  }),
  customer_full_name: model.text().index("IDX_BOOKING_CUSTOMER_NAME"),
  customer_email: model.text().index("IDX_BOOKING_CUSTOMER_EMAIL"),
  customer_phone: model.text().nullable(),
  notes: model.text().nullable(),
  status: model.enum(BookingStatuses).default("pending").index("IDX_BOOKING_STATUS"),
  scheduled_start_at: model.dateTime().index("IDX_BOOKING_START"),
  scheduled_end_at: model.dateTime().index("IDX_BOOKING_END"),
  timezone: model.text().default("UTC"),
  cancelled_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

export default Booking
