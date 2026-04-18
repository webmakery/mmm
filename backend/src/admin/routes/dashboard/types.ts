export type DashboardResponse = {
  generated_at: string
  currency_code?: string | null
  timezone: string
  revenue: {
    today: number
    this_week: number
    this_month: number
  }
  leads: {
    total: number
    new_today: number
    recent: Array<{
      id: string
      created_at: string
      first_name?: string | null
      last_name?: string | null
      email?: string | null
      company?: string | null
      status?: string | null
      owner_user_id?: string | null
      next_follow_up_at?: string | null
    }>
  }
  bookings: {
    total: number
    today: number
    pending: number
    upcoming: Array<{
      id: string
      reference?: string | null
      customer_full_name: string
      customer_email?: string | null
      status?: string | null
      scheduled_start_at: string
      service_name?: string | null
    }>
  }
  orders: {
    total: number
    today: number
    this_week: number
    this_month: number
    recent: Array<{
      id: string
      display_id?: number | null
      created_at: string
      total: number
      currency_code?: string | null
      payment_status?: string | null
      fulfillment_status?: string | null
      status?: string | null
      email?: string | null
    }>
  }
  customers: {
    total: number
    today: number
    this_week: number
    this_month: number
  }
  carts: {
    open_count: number
  }
  statuses: {
    refunded_orders: number
    pending_fulfillment: number
    unpaid_orders: number
  }
  charts: {
    leads_last_7_days: Array<{ date: string; label: string; value: number }>
    bookings_last_7_days: Array<{ date: string; label: string; value: number }>
    revenue_last_30_days: Array<{ date: string; label: string; value: number }>
  }
  operational_alerts: Array<{
    id: string
    title: string
    value: number
  }>
}
