import { Metadata } from "next"
import { notFound } from "next/navigation"

import { retrieveStoreBooking } from "@lib/data/bookings"
import BookingConfirmationTemplate from "@modules/booking/templates/booking-confirmation"

type Props = {
  searchParams: Promise<{ booking_id?: string }>
}

export const metadata: Metadata = {
  title: "Booking confirmation",
  description: "Booking confirmation details.",
}

export default async function BookingConfirmationPage(props: Props) {
  const searchParams = await props.searchParams

  if (!searchParams.booking_id) {
    return notFound()
  }

  const booking = await retrieveStoreBooking(searchParams.booking_id)

  if (!booking) {
    return notFound()
  }

  return <BookingConfirmationTemplate booking={booking} />
}
