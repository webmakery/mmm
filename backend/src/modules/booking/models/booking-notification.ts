import { model } from "@medusajs/framework/utils"
import Booking from "./booking"

export const BookingNotificationTypes = ["confirmation", "cancellation", "reminder", "update"]

const BookingNotification = model.define("booking_notification", {
  id: model.id().primaryKey(),
  booking: model.belongsTo(() => Booking),
  type: model.enum(BookingNotificationTypes).index("IDX_BOOKING_NOTIFICATION_TYPE"),
  channel: model.text().default("feed"),
  payload: model.json().nullable(),
  sent_at: model.dateTime().nullable(),
})

export default BookingNotification
