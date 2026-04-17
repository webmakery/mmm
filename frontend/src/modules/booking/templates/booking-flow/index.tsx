"use client"

import { Button, Input, Label, Text, Textarea } from "@medusajs/ui"
import { FormEvent, useMemo, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import type { StoreBookingService } from "@lib/data/bookings"
import type { StoreBranding } from "@lib/data/store-branding"

type BookingFlowProps = {
  branding: StoreBranding
  services: StoreBookingService[]
}

const MEDUSA_BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "")
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

const getHeaders = (withBody = false) => {
  const headers: HeadersInit = {}

  if (withBody) {
    headers["Content-Type"] = "application/json"
  }

  if (PUBLISHABLE_API_KEY) {
    headers["x-publishable-api-key"] = PUBLISHABLE_API_KEY
  }

  return headers
}

const formatMonthTitle = (date: Date) =>
  new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(date)

const toDateKey = (date: Date) =>
  `${date.getUTCFullYear()}-${`${date.getUTCMonth() + 1}`.padStart(2, "0")}-${`${date.getUTCDate()}`.padStart(2, "0")}`

const toTimeLabel = (value: string) => {
  const [hours, minutes] = value.split(":")
  const date = new Date()
  date.setHours(Number(hours), Number(minutes), 0, 0)

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function BookingFlow({ branding, services }: BookingFlowProps) {
  const router = useRouter()
  const params = useParams<{ countryCode: string }>()
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  })

  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id || "")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"slots" | "form">("slots")

  const [formData, setFormData] = useState({
    customer_full_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  })

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [selectedServiceId, services]
  )

  const dayCells = useMemo(() => {
    const start = new Date(monthCursor)
    const startDay = start.getUTCDay()

    const firstGridDate = new Date(start)
    firstGridDate.setUTCDate(firstGridDate.getUTCDate() - startDay)

    return Array.from({ length: 35 }).map((_, index) => {
      const date = new Date(firstGridDate)
      date.setUTCDate(firstGridDate.getUTCDate() + index)

      const key = toDateKey(date)
      const now = new Date()
      const todayKey = toDateKey(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())))

      return {
        date,
        key,
        dayLabel: `${date.getUTCDate()}`,
        muted: date.getUTCMonth() !== monthCursor.getUTCMonth() || key < todayKey,
      }
    })
  }, [monthCursor])

  const onDateSelect = async (dateKey: string) => {
    if (!selectedServiceId) {
      return
    }

    setSelectedDate(dateKey)
    setSelectedTime("")
    setStep("slots")
    setError(null)
    setLoadingSlots(true)

    try {
      const params = new URLSearchParams({
        service_id: selectedServiceId,
        date: dateKey,
      })

      if (selectedService?.timezone) {
        params.set("timezone", selectedService.timezone)
      }

      const response = await fetch(`${MEDUSA_BACKEND_URL || ""}/store/bookings/availability?${params.toString()}`, {
        headers: getHeaders(),
      })

      if (!response.ok) {
        throw new Error("availability_error")
      }

      const payload = await response.json()
      setSlots(payload.slots || [])
    } catch {
      setSlots([])
      setError("Could not load available times. Please try another date.")
    } finally {
      setLoadingSlots(false)
    }
  }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!selectedService || !selectedDate || !selectedTime) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${MEDUSA_BACKEND_URL || ""}/store/bookings`, {
        method: "POST",
        headers: getHeaders(true),
        body: JSON.stringify({
          service_id: selectedService.id,
          customer_full_name: formData.customer_full_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone || undefined,
          notes: formData.notes || undefined,
          timezone: selectedService.timezone,
          scheduled_start_at: new Date(`${selectedDate}T${selectedTime}:00.000Z`).toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error("create_booking_error")
      }

      const payload = await response.json()
      const countryCode = params?.countryCode || "us"

      router.push(`/${countryCode}/booking/confirmation?booking_id=${payload.booking.id}`)
    } catch {
      setError("Could not create booking. The selected slot might no longer be available.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!services.length || !selectedService) {
    return (
      <div className="content-container py-10 small:py-12" data-testid="booking-page">
        <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-rounded border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest p-6">
          <Text className="text-ui-fg-subtle">No booking services are currently available.</Text>
        </div>
      </div>
    )
  }

  return (
    <div className="content-container py-10 small:py-12" data-testid="booking-page">
      <div className="mx-auto w-full max-w-6xl overflow-hidden rounded-rounded border border-ui-border-base bg-ui-bg-base shadow-elevation-card-rest">
        <div className="grid grid-cols-1 divide-y divide-ui-border-base small:grid-cols-[280px_1fr_320px] small:divide-x small:divide-y-0">
          <aside className="flex flex-col gap-y-5 p-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ui-bg-field text-small-plus text-ui-fg-base">
              {branding.store_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="flex flex-col gap-y-1">
              <p className="txt-small-plus text-ui-fg-subtle">{branding.store_name}</p>
              <h1 className="text-2xl-semi">{selectedService.name}</h1>
            </div>
            <div className="flex flex-col gap-y-3 text-small-regular text-ui-fg-subtle">
              <p>{selectedService.duration_minutes} minutes</p>
              <p>Video call</p>
              <p>{selectedService.timezone}</p>
            </div>
            <div className="flex flex-col gap-y-2">
              {services.map((service) => (
                <Button
                  key={service.id}
                  size="small"
                  variant={selectedServiceId === service.id ? "primary" : "secondary"}
                  onClick={() => {
                    setSelectedServiceId(service.id)
                    setSelectedDate("")
                    setSelectedTime("")
                    setSlots([])
                    setStep("slots")
                  }}
                >
                  {service.name}
                </Button>
              ))}
            </div>
          </aside>

          <section className="p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-large-semi">{formatMonthTitle(monthCursor)}</h2>
              <div className="flex items-center gap-x-2">
                <Button variant="secondary" size="small" onClick={() => setMonthCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() - 1, 1)))}>
                  Prev
                </Button>
                <Button variant="secondary" size="small" onClick={() => setMonthCursor((prev) => new Date(Date.UTC(prev.getUTCFullYear(), prev.getUTCMonth() + 1, 1)))}>
                  Next
                </Button>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-7 gap-2">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((weekDay) => (
                <p key={weekDay} className="txt-small-plus text-ui-fg-subtle">
                  {weekDay}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {dayCells.map((dayCell) => (
                <button
                  key={dayCell.key}
                  type="button"
                  disabled={dayCell.muted}
                  onClick={() => onDateSelect(dayCell.key)}
                  className={[
                    "h-12 rounded-rounded border txt-small-plus transition-colors",
                    selectedDate === dayCell.key
                      ? "border-ui-fg-base bg-ui-fg-base text-ui-bg-base"
                      : "border-ui-border-base bg-ui-bg-field text-ui-fg-base hover:bg-ui-bg-field-hover",
                    dayCell.muted ? "text-ui-fg-muted" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {dayCell.dayLabel}
                </button>
              ))}
            </div>
          </section>

          <section className="flex flex-col p-6">
            {step === "slots" ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-large-semi">{selectedDate || "Select a date"}</h2>
                </div>

                <div className="flex flex-col gap-y-2">
                  {loadingSlots ? <Text className="text-ui-fg-subtle">Loading times...</Text> : null}
                  {!loadingSlots && selectedDate && !slots.length ? (
                    <Text className="text-ui-fg-subtle">No available times on this date.</Text>
                  ) : null}
                  {slots.map((slot) => (
                    <Button
                      key={slot}
                      variant="secondary"
                      className="justify-start"
                      size="large"
                      onClick={() => {
                        setSelectedTime(slot)
                        setStep("form")
                      }}
                    >
                      {toTimeLabel(slot)}
                    </Button>
                  ))}
                </div>
              </>
            ) : (
              <form className="flex h-full flex-col gap-y-3" onSubmit={onSubmit}>
                <h2 className="text-large-semi">Enter your details</h2>
                <Text className="text-ui-fg-subtle">
                  {selectedDate} · {toTimeLabel(selectedTime)}
                </Text>

                <div>
                  <Label htmlFor="customer_full_name">Your name *</Label>
                  <Input
                    id="customer_full_name"
                    required
                    value={formData.customer_full_name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, customer_full_name: event.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_email">Email address *</Label>
                  <Input
                    id="customer_email"
                    required
                    type="email"
                    value={formData.customer_email}
                    onChange={(event) => setFormData((prev) => ({ ...prev, customer_email: event.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="customer_phone">Phone number</Label>
                  <Input
                    id="customer_phone"
                    value={formData.customer_phone}
                    onChange={(event) => setFormData((prev) => ({ ...prev, customer_phone: event.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional notes</Label>
                  <Textarea
                    id="notes"
                    rows={4}
                    value={formData.notes}
                    onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
                  />
                </div>

                {error ? <Text className="text-ui-fg-error">{error}</Text> : null}

                <div className="mt-auto flex items-center justify-end gap-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setStep("slots")
                      setError(null)
                    }}
                  >
                    Back
                  </Button>
                  <Button type="submit" isLoading={isSubmitting}>
                    Confirm
                  </Button>
                </div>
              </form>
            )}
            {step === "slots" && error ? <Text className="mt-3 text-ui-fg-error">{error}</Text> : null}
          </section>
        </div>
      </div>
    </div>
  )
}
