export type DashboardResponse = {
  generated_at: string
  timezone: string
  currency_code?: string | null
  customers: {
    total: number
  }
  executive_kpis: {
    revenue_this_month: {
      value: number
      previous: number
      change_percent: number
    }
    bookings_this_month: {
      value: number
      previous: number
      change_percent: number
    }
    lead_to_booking_conversion: {
      value: number
      previous: number
      change_percent: number
    }
    average_order_value: {
      value: number
      previous: number
      change_percent: number
    }
    unpaid_amount: {
      value: number
      previous: number
      change_percent: number
      unpaid_orders: number
    }
    urgent_action_items: {
      value: number
      previous: number
      change_percent: number
    }
  }
  snapshot_insights: Array<{
    id: string
    title: string
    detail: string
  }>
  performance: {
    revenue_trend_30_days: Array<{ date: string; label: string; value: number }>
    leads_vs_bookings_30_days: Array<{ date: string; label: string; leads: number; bookings: number }>
    funnel_conversion_by_stage: Array<{
      stage: string
      count: number
      share: number
      conversion_from_leads: number
    }>
    top_products_by_revenue: Array<{
      label: string
      revenue: number
      bookings: number
    }>
    top_services_by_bookings: Array<{
      label: string
      revenue: number
      bookings: number
    }>
  }
  attention_required: {
    unassigned_leads: {
      value: number
      preview: Array<{ id: string; label: string; context: string }>
    }
    overdue_follow_ups: {
      value: number
      preview: Array<{ id: string; label: string; context: string }>
    }
    unpaid_orders: {
      value: number
      preview: Array<{ id: string; label: string; context: string }>
    }
    low_stock: {
      value: number
      preview: Array<{ id: string; label: string; context: string }>
    }
    upcoming_confirmations: {
      value: number
      preview: Array<{ id: string; label: string; context: string }>
    }
  }
}
