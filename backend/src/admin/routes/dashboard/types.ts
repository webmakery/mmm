export type DashboardResponse = {
  generated_at: string
  currency_code?: string | null
  timezone: string
  revenue: {
    today: number
    this_week: number
    this_month: number
  }
  orders: {
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
  top_products: Array<{
    title: string
    quantity: number
  }>
  top_variants: Array<{
    title: string
    quantity: number
  }>
  inventory: {
    out_of_stock_count: number
    low_stock: Array<{
      id: string
      product_title: string
      variant_title: string
      sku?: string | null
      inventory_quantity: number
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
    recent_open: Array<{
      id: string
      email?: string | null
      created_at: string
      updated_at: string
    }>
  }
  statuses: {
    refunded_orders: number
    pending_fulfillment: number
    unpaid_orders: number
  }
  operational_alerts: Array<{
    id: string
    title: string
    value: number
  }>
}
