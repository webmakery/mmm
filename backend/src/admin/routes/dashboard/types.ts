export type DashboardResponse = {
  generated_at: string
  timezone: string
  currency_code?: string | null
  customers: {
    total: number
  }
  operational_risks: {
    unassigned_leads: number
    overdue_follow_ups: number
    unpaid_orders: number
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
    channel_performance: {
      first_touch: Array<{
        source: string
        visitors: number
        engaged_visitors: number
        signups: number
        checkout_starts: number
        purchases: number
        revenue: number
        signup_rate: number
        checkout_rate: number
        purchase_rate: number
        aov: number
      }>
      last_touch: Array<{
        source: string
        visitors: number
        engaged_visitors: number
        signups: number
        checkout_starts: number
        purchases: number
        revenue: number
        signup_rate: number
        checkout_rate: number
        purchase_rate: number
        aov: number
      }>
    }
  }
  full_funnel: {
    stages: Array<{
      key: "leads" | "qualified" | "bookings" | "completed" | "paid"
      label: string
      count: number
      conversion_from_previous: number
      dropoff_from_previous: number
      href: string
    }>
    derived_metrics: {
      lead_to_booking_conversion: number
      booking_to_paid_conversion: number
      overall_funnel_conversion: number
      average_hours_lead_to_booking: number
      average_hours_booking_to_payment: number
    }
    period_comparison: {
      week: {
        lead_to_booking_change_percent: number
        booking_to_paid_change_percent: number
      }
      month: {
        lead_to_booking_change_percent: number
        booking_to_paid_change_percent: number
      }
    }
    insights: Array<{
      id: string
      detail: string
    }>
  }
}
