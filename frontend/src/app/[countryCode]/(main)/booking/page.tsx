import { Metadata } from "next"

import { getStoreBranding } from "@lib/data/store-branding"
import { Button } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Booking",
  description: "Schedule an appointment with our team.",
}

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

const calendarDays = [
  { day: "8", muted: true },
  { day: "9", muted: true },
  { day: "10", muted: true },
  { day: "11", muted: true },
  { day: "12", muted: true },
  { day: "13", muted: true },
  { day: "14", muted: true },
  { day: "15", muted: true },
  { day: "16", muted: true },
  { day: "17", muted: false },
  { day: "18", muted: true },
  { day: "19", muted: true },
  { day: "20", selected: true },
  { day: "21", muted: false },
  { day: "22", muted: false },
  { day: "23", muted: false },
  { day: "24", muted: false },
  { day: "25", muted: true },
  { day: "26", muted: true },
  { day: "27", muted: false },
  { day: "28", muted: false },
  { day: "29", muted: false },
  { day: "30", muted: false },
  { day: "1", muted: false },
  { day: "2", muted: true },
]

const slots = [
  "10:00 AM",
  "10:15 AM",
  "10:30 AM",
  "10:45 AM",
  "11:00 AM",
  "11:15 AM",
  "11:30 AM",
  "11:45 AM",
  "12:00 PM",
  "12:15 PM",
]

export default async function BookingPage() {
  const branding = await getStoreBranding()

  return (
    <div className="content-container py-10 small:py-12" data-testid="booking-page">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-rounded border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest">
        <div className="grid grid-cols-1 divide-y divide-ui-border-base small:grid-cols-[280px_1fr_280px] small:divide-x small:divide-y-0">
          <aside className="flex flex-col gap-y-5 p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ui-bg-field text-small-plus text-ui-fg-base">
              {branding.store_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="txt-small-plus text-ui-fg-subtle">{branding.store_name}</p>
              <h1 className="text-2xl-semi">Book an appointment</h1>
            </div>
            <div className="flex flex-col gap-y-3 text-small-regular text-ui-fg-subtle">
              <p>15 minutes</p>
              <p>Video call</p>
              <p>Europe/Berlin</p>
            </div>
          </aside>

          <section className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-large-semi">April 2026</h2>
              <p className="txt-small text-ui-fg-subtle">Select a date</p>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-2">
              {weekDays.map((weekDay) => (
                <p key={weekDay} className="txt-small-plus text-ui-fg-subtle">
                  {weekDay}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((calendarDay, index) => (
                <button
                  key={`${calendarDay.day}-${index}`}
                  type="button"
                  className={[
                    "h-12 rounded-rounded border txt-small-plus transition-colors",
                    calendarDay.selected
                      ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                      : "border-ui-border-base bg-ui-bg-field text-ui-fg-base hover:bg-ui-bg-field-hover",
                    calendarDay.muted ? "text-ui-fg-muted" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {calendarDay.day}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-large-semi">Mon 20</h2>
              <div className="flex items-center gap-x-2">
                <Button size="small" variant="secondary">
                  12h
                </Button>
                <Button size="small" variant="transparent">
                  24h
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              {slots.map((slot) => (
                <Button key={slot} variant="secondary" className="justify-start" size="large">
                  {slot}
                </Button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
