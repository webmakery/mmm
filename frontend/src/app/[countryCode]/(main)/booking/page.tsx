import { Metadata } from "next"

import { listStoreBookingServices } from "@lib/data/bookings"
import { getStoreBranding } from "@lib/data/store-branding"
import BookingFlow from "@modules/booking/templates/booking-flow"

export const metadata: Metadata = {
  title: "Booking",
  description: "Schedule an appointment with our team.",
}

export default async function BookingPage() {
  const [branding, services] = await Promise.all([
    getStoreBranding(),
    listStoreBookingServices(),
  ])

  return <BookingFlow branding={branding} services={services} />
}
