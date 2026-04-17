import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Button, Heading, Text } from "@medusajs/ui"
import type { StoreBooking } from "@lib/data/bookings"

type BookingConfirmationTemplateProps = {
  booking: StoreBooking
}

const formatBookingDate = (value: string, timezone: string) => {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ""
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone || "UTC",
  }).format(date)
}

export default function BookingConfirmationTemplate({ booking }: BookingConfirmationTemplateProps) {
  return (
    <div className="content-container py-10 small:py-12">
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-rounded border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest p-8">
        <div className="mb-6 flex flex-col items-center gap-y-3 text-center">
          <Heading level="h1">This meeting is scheduled</Heading>
          <Text className="text-ui-fg-subtle">
            We sent a confirmation for your booking details.
          </Text>
        </div>

        <div className="my-6 border-t border-ui-border-base" />

        <div className="grid grid-cols-[120px_1fr] gap-y-4">
          <Text className="txt-small-plus">What</Text>
          <Text>{booking.service?.name || "Meeting"}</Text>

          <Text className="txt-small-plus">When</Text>
          <Text>{formatBookingDate(booking.scheduled_start_at, booking.timezone)}</Text>

          <Text className="txt-small-plus">Who</Text>
          <div className="flex flex-col gap-y-1">
            <Text>{booking.customer_full_name}</Text>
            <Text className="text-ui-fg-subtle">{booking.customer_email}</Text>
            {booking.customer_phone ? <Text className="text-ui-fg-subtle">{booking.customer_phone}</Text> : null}
          </div>

          <Text className="txt-small-plus">Reference</Text>
          <Text>{booking.reference}</Text>

          {booking.notes ? (
            <>
              <Text className="txt-small-plus">Notes</Text>
              <Text>{booking.notes}</Text>
            </>
          ) : null}
        </div>

        <div className="my-6 border-t border-ui-border-base" />

        <div className="flex justify-center">
          <LocalizedClientLink href="/booking">
            <Button variant="secondary">Back to bookings</Button>
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
