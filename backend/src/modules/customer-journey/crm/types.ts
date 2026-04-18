export type CrmSyncPayload = {
  customer_id: string
  first_seen_at: string | null
  first_signup_at: string | null
  first_order_at: string | null
  first_payment_captured_at: string | null
  latest_source: string | null
  latest_medium: string | null
  latest_campaign: string | null
  total_sessions: number
  total_events: number
}

export interface CustomerJourneyCrmAdapter {
  syncCustomerSummary(payload: CrmSyncPayload): Promise<{ status: "synced" | "skipped"; message?: string }>
}
