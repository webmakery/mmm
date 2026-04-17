import { defineRouteConfig } from "@medusajs/admin-sdk"
import { SquaresPlus } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, StatusBadge, Switch, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type BookingService = {
  id: string
  name: string
  description?: string
  duration_minutes: number
  availability_start_time: string
  availability_end_time: string
  timezone: string
  price?: number
  is_active: boolean
}

type BookingRules = {
  id: string
  minimum_notice_minutes: number
  maximum_days_in_advance: number
  cancellation_window_hours: number
  reschedule_window_hours: number
  same_day_booking_enabled: boolean
  buffer_minutes: number
  timezone: string
  blackout_dates?: { dates?: string[] }
}

type BookingRecord = {
  id: string
  reference: string
  service_id: string
  service_name?: string
  customer_full_name: string
  customer_email: string
  customer_phone?: string
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  scheduled_start_at: string
  scheduled_end_at: string
}

const statusColors: Record<BookingRecord["status"], "grey" | "blue" | "red" | "green" | "orange"> = {
  pending: "orange",
  confirmed: "blue",
  cancelled: "red",
  completed: "green",
  no_show: "grey",
}

const BookingsPage = () => {
  const [status, setStatus] = useState("__all")
  const [serviceId, setServiceId] = useState("__all")
  const [customer, setCustomer] = useState("")
  const [date, setDate] = useState("")
  const [bookingForm, setBookingForm] = useState({
    service_id: "",
    date: "",
    time: "",
    customer_full_name: "",
    customer_email: "",
    customer_phone: "",
    notes: "",
  })
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration_minutes: "30",
    availability_start_time: "09:00",
    availability_end_time: "17:00",
    timezone: "UTC",
    price: "",
  })

  const [rulesForm, setRulesForm] = useState<BookingRules | null>(null)
  const [slotDate, setSlotDate] = useState("")

  const bookingQuery = useMemo(
    () => ({
      status: status === "__all" ? undefined : status,
      service_id: serviceId === "__all" ? undefined : serviceId,
      customer: customer.trim() || undefined,
      date: date || undefined,
      limit: 100,
      offset: 0,
    }),
    [status, serviceId, customer, date]
  )

  const { data: servicesData, refetch: refetchServices } = useQuery<{ services: BookingService[] }>({
    queryKey: ["booking-services"],
    queryFn: () => sdk.client.fetch("/admin/booking-services"),
  })

  const { data: bookingsData, refetch: refetchBookings, isLoading: bookingsLoading } = useQuery<{ bookings: BookingRecord[]; count: number }>({
    queryKey: ["bookings", bookingQuery],
    queryFn: () => sdk.client.fetch("/admin/bookings", { query: bookingQuery }),
  })

  const { data: rulesData, refetch: refetchRules } = useQuery<{ rules: BookingRules }>({
    queryKey: ["booking-rules"],
    queryFn: () => sdk.client.fetch("/admin/booking-rules"),
  })

  const { data: slotsData, refetch: refetchSlots, isFetching: slotsLoading } = useQuery<{ slots: string[] }>({
    queryKey: ["booking-slots", bookingForm.service_id, slotDate],
    queryFn: () =>
      sdk.client.fetch("/store/bookings/availability", {
        query: {
          service_id: bookingForm.service_id,
          date: slotDate,
        },
      }),
    enabled: Boolean(bookingForm.service_id && slotDate),
  })

  const createServiceMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/booking-services", {
        method: "POST",
        body: {
          ...serviceForm,
          duration_minutes: Number(serviceForm.duration_minutes),
          price: serviceForm.price ? Number(serviceForm.price) : undefined,
        },
      }),
    onSuccess: () => {
      toast.success("Service created")
      setServiceForm({
        name: "",
        description: "",
        duration_minutes: "30",
        availability_start_time: "09:00",
        availability_end_time: "17:00",
        timezone: "UTC",
        price: "",
      })
      refetchServices()
    },
    onError: () => toast.error("Unable to create service"),
  })

  const createBookingMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch("/admin/bookings", {
        method: "POST",
        body: {
          service_id: bookingForm.service_id,
          customer_full_name: bookingForm.customer_full_name,
          customer_email: bookingForm.customer_email,
          customer_phone: bookingForm.customer_phone || undefined,
          notes: bookingForm.notes || undefined,
          scheduled_start_at: new Date(`${bookingForm.date}T${bookingForm.time}:00.000Z`).toISOString(),
          status: "confirmed",
        },
      }),
    onSuccess: () => {
      toast.success("Booking created")
      refetchBookings()
      setBookingForm({
        service_id: bookingForm.service_id,
        date: "",
        time: "",
        customer_full_name: "",
        customer_email: "",
        customer_phone: "",
        notes: "",
      })
    },
    onError: () => toast.error("Could not create booking. Slot may be unavailable."),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "confirm" | "cancel" }) =>
      sdk.client.fetch(`/admin/bookings/${id}`, {
        method: "POST",
        body: {
          action,
        },
      }),
    onSuccess: () => refetchBookings(),
    onError: () => toast.error("Unable to update booking"),
  })

  const saveRulesMutation = useMutation({
    mutationFn: () => sdk.client.fetch("/admin/booking-rules", { method: "POST", body: rulesForm }),
    onSuccess: () => {
      toast.success("Rules updated")
      refetchRules()
    },
    onError: () => toast.error("Unable to update rules"),
  })

  const bookings = bookingsData?.bookings || []

  const metrics = useMemo(() => {
    return {
      total: bookings.length,
      today: bookings.filter((booking) => booking.scheduled_start_at.slice(0, 10) === new Date().toISOString().slice(0, 10)).length,
      pending: bookings.filter((booking) => booking.status === "pending").length,
      cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
    }
  }, [bookings])

  const onCreateBookingSubmit = (event: FormEvent) => {
    event.preventDefault()

    if (!bookingForm.service_id || !bookingForm.date || !bookingForm.time || !bookingForm.customer_full_name || !bookingForm.customer_email) {
      toast.error("Please fill in all required fields")
      return
    }

    createBookingMutation.mutate()
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Bookings</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Service scheduling, booking lifecycle, and customer operations in one workflow.
            </Text>
          </div>
          <Badge size="2xsmall" color="blue">
            MVP
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4 md:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Total bookings</Text>
            <Heading level="h2">{metrics.total}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Today</Text>
            <Heading level="h2">{metrics.today}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Pending</Text>
            <Heading level="h2">{metrics.pending}</Heading>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Cancelled</Text>
            <Heading level="h2">{metrics.cancelled}</Heading>
          </Container>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-4">
          <Input placeholder="Customer" value={customer} onChange={(event) => setCustomer(event.target.value)} />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <Select value={status} onValueChange={setStatus}>
            <Select.Trigger>
              <Select.Value placeholder="Status" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="__all">All statuses</Select.Item>
              <Select.Item value="pending">Pending</Select.Item>
              <Select.Item value="confirmed">Confirmed</Select.Item>
              <Select.Item value="cancelled">Cancelled</Select.Item>
              <Select.Item value="completed">Completed</Select.Item>
              <Select.Item value="no_show">No-show</Select.Item>
            </Select.Content>
          </Select>
          <Select value={serviceId} onValueChange={setServiceId}>
            <Select.Trigger>
              <Select.Value placeholder="Service" />
            </Select.Trigger>
            <Select.Content>
              <Select.Item value="__all">All services</Select.Item>
              {(servicesData?.services || []).map((service) => (
                <Select.Item key={service.id} value={service.id}>
                  {service.name}
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>

        <div className="px-6 py-4">
          <Container className="divide-y p-0">
            {bookings.map((booking) => (
              <div key={booking.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Text weight="plus">{booking.customer_full_name}</Text>
                    <StatusBadge color={statusColors[booking.status]}>{booking.status.replace("_", " ")}</StatusBadge>
                    <StatusBadge color="grey">{booking.service_name || "Service"}</StatusBadge>
                  </div>
                  <Text size="small" className="text-ui-fg-subtle">
                    {booking.reference} · {new Date(booking.scheduled_start_at).toLocaleString()} · {booking.customer_email}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="small" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: booking.id, action: "confirm" })}>
                    Confirm
                  </Button>
                  <Button size="small" variant="secondary" onClick={() => updateStatusMutation.mutate({ id: booking.id, action: "cancel" })}>
                    Cancel
                  </Button>
                </div>
              </div>
            ))}
            {!bookings.length ? (
              <div className="px-3 py-6">
                <Text size="small" className="text-ui-fg-subtle">
                  {bookingsLoading ? "Loading bookings..." : "No bookings found for the selected filters."}
                </Text>
              </div>
            ) : null}
          </Container>
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Container className="space-y-4 px-6 py-4 xl:col-span-2">
          <div>
            <Heading level="h2">Create booking</Heading>
            <Text size="small" className="text-ui-fg-subtle">
              Customer flow MVP: service, slot, details, and confirmation reference.
            </Text>
          </div>

          <form className="space-y-4" onSubmit={onCreateBookingSubmit}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                value={bookingForm.service_id}
                onValueChange={(value) => {
                  setBookingForm((prev) => ({ ...prev, service_id: value }))
                  setSlotDate(bookingForm.date)
                }}
              >
                <Select.Trigger>
                  <Select.Value placeholder="Service" />
                </Select.Trigger>
                <Select.Content>
                  {(servicesData?.services || []).map((service) => (
                    <Select.Item key={service.id} value={service.id}>
                      {service.name}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
              <Input
                type="date"
                value={bookingForm.date}
                onChange={(event) => {
                  const nextDate = event.target.value
                  setBookingForm((prev) => ({ ...prev, date: nextDate, time: "" }))
                  setSlotDate(nextDate)
                  refetchSlots()
                }}
              />
            </div>

            <Select value={bookingForm.time} onValueChange={(value) => setBookingForm((prev) => ({ ...prev, time: value }))}>
              <Select.Trigger>
                <Select.Value placeholder={slotsLoading ? "Loading available slots..." : "Available slots"} />
              </Select.Trigger>
              <Select.Content>
                {(slotsData?.slots || []).map((slot) => (
                  <Select.Item key={slot} value={slot}>
                    {slot}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                placeholder="Full name"
                value={bookingForm.customer_full_name}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, customer_full_name: event.target.value }))}
              />
              <Input
                placeholder="Email"
                type="email"
                value={bookingForm.customer_email}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, customer_email: event.target.value }))}
              />
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Input
                placeholder="Phone (optional)"
                value={bookingForm.customer_phone}
                onChange={(event) => setBookingForm((prev) => ({ ...prev, customer_phone: event.target.value }))}
              />
              <Input value={bookingForm.time ? `Ref created on submit` : "Select slot first"} readOnly />
            </div>

            <Textarea
              placeholder="Notes (optional)"
              value={bookingForm.notes}
              onChange={(event) => setBookingForm((prev) => ({ ...prev, notes: event.target.value }))}
            />

            <div className="flex items-center justify-between">
              <Text size="small" className="text-ui-fg-subtle">
                Confirmation, cancellation, reminder, and update notifications are logged automatically.
              </Text>
              <Button type="submit" isLoading={createBookingMutation.isPending}>Create booking</Button>
            </div>
          </form>
        </Container>

        <Container className="space-y-4 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Heading level="h2">Booking rules</Heading>
              <Text size="small" className="text-ui-fg-subtle">Notice periods, booking window, and same-day policy.</Text>
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => setRulesForm((rulesData?.rules as BookingRules) || null)}
            >
              Load
            </Button>
          </div>

          {rulesForm ? (
            <div className="space-y-3">
              <Input type="number" value={rulesForm.minimum_notice_minutes} onChange={(event) => setRulesForm({ ...rulesForm, minimum_notice_minutes: Number(event.target.value) })} />
              <Input type="number" value={rulesForm.maximum_days_in_advance} onChange={(event) => setRulesForm({ ...rulesForm, maximum_days_in_advance: Number(event.target.value) })} />
              <Input type="number" value={rulesForm.cancellation_window_hours} onChange={(event) => setRulesForm({ ...rulesForm, cancellation_window_hours: Number(event.target.value) })} />
              <Input type="number" value={rulesForm.reschedule_window_hours} onChange={(event) => setRulesForm({ ...rulesForm, reschedule_window_hours: Number(event.target.value) })} />
              <Input type="number" value={rulesForm.buffer_minutes} onChange={(event) => setRulesForm({ ...rulesForm, buffer_minutes: Number(event.target.value) })} />
              <div className="flex items-center justify-between rounded-md border border-ui-border-base px-3 py-2">
                <Label>Allow same-day booking</Label>
                <Switch checked={rulesForm.same_day_booking_enabled} onCheckedChange={(checked) => setRulesForm({ ...rulesForm, same_day_booking_enabled: checked })} />
              </div>
              <Button className="w-full" onClick={() => saveRulesMutation.mutate()} isLoading={saveRulesMutation.isPending}>Save rules</Button>
            </div>
          ) : (
            <Text size="small" className="text-ui-fg-subtle">Load current rules to edit.</Text>
          )}
        </Container>
      </div>

      <Drawer>
        <Drawer.Trigger asChild>
          <Button variant="secondary">Manage services</Button>
        </Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Bookable services/items</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body>
            <div className="space-y-4">
              <div className="space-y-3">
                {(servicesData?.services || []).map((service) => (
                  <Container key={service.id} className="flex items-center justify-between px-3 py-3">
                    <div>
                      <Text weight="plus">{service.name}</Text>
                      <Text size="small" className="text-ui-fg-subtle">
                        {service.duration_minutes} mins · {service.availability_start_time}-{service.availability_end_time} · {service.timezone}
                      </Text>
                    </div>
                    <StatusBadge color={service.is_active ? "green" : "grey"}>{service.is_active ? "Active" : "Inactive"}</StatusBadge>
                  </Container>
                ))}
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault()
                  if (!serviceForm.name.trim()) {
                    toast.error("Service name is required")
                    return
                  }
                  createServiceMutation.mutate()
                }}
              >
                <Input placeholder="Name" value={serviceForm.name} onChange={(event) => setServiceForm((prev) => ({ ...prev, name: event.target.value }))} />
                <Textarea placeholder="Description" value={serviceForm.description} onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" placeholder="Duration (mins)" value={serviceForm.duration_minutes} onChange={(event) => setServiceForm((prev) => ({ ...prev, duration_minutes: event.target.value }))} />
                  <Input type="number" placeholder="Price" value={serviceForm.price} onChange={(event) => setServiceForm((prev) => ({ ...prev, price: event.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input value={serviceForm.availability_start_time} onChange={(event) => setServiceForm((prev) => ({ ...prev, availability_start_time: event.target.value }))} />
                  <Input value={serviceForm.availability_end_time} onChange={(event) => setServiceForm((prev) => ({ ...prev, availability_end_time: event.target.value }))} />
                </div>
                <Input value={serviceForm.timezone} onChange={(event) => setServiceForm((prev) => ({ ...prev, timezone: event.target.value }))} />
                <Button type="submit" className="w-full" isLoading={createServiceMutation.isPending}>Create service</Button>
              </form>
            </div>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Bookings",
  icon: SquaresPlus,
})

export default BookingsPage
