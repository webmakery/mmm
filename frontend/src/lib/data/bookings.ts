"use server"

import { sdk } from "@lib/config"

export type StoreBookingService = {
  id: string
  name: string
  description?: string | null
  duration_minutes: number
  availability_start_time: string
  availability_end_time: string
  timezone: string
  is_active: boolean
}

export type StoreBooking = {
  id: string
  reference: string
  service_id: string
  customer_full_name: string
  customer_email: string
  customer_phone?: string | null
  notes?: string | null
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  scheduled_start_at: string
  scheduled_end_at: string
  timezone: string
  service?: StoreBookingService
}

export const listStoreBookingServices = async () => {
  return sdk.client
    .fetch<{ services: StoreBookingService[] }>("/store/booking-services", {
      method: "GET",
      cache: "no-store",
    })
    .then(({ services }) => services)
    .catch(() => [])
}

export const retrieveStoreBooking = async (id: string) => {
  return sdk.client
    .fetch<{ booking: StoreBooking }>(`/store/bookings/${id}`, {
      method: "GET",
      cache: "no-store",
    })
    .then(({ booking }) => booking)
    .catch(() => null)
}
