import { Module } from "@medusajs/framework/utils"
import BookingModuleService from "./service"
import seedDefaultBookingRules from "./loaders/seed-default-booking-rules"

export const BOOKING_MODULE = "booking"

export default Module(BOOKING_MODULE, {
  service: BookingModuleService,
  loaders: [seedDefaultBookingRules],
})
