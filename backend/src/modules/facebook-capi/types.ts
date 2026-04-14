export type FacebookCapiModuleOptions = {
  pixelId?: string
  accessToken?: string
  apiVersion?: string
  testEventCode?: string
  enabled?: boolean
  timeoutMs?: number
  maxRetries?: number
}

export type FacebookUserData = {
  em?: string[]
  ph?: string[]
  external_id?: string[]
  client_ip_address?: string
  client_user_agent?: string
}

export type FacebookCustomData = {
  currency?: string
  value?: number
  content_ids?: string[]
  contents?: Array<{
    id: string
    quantity?: number
    item_price?: number
  }>
  num_items?: number
  order_id?: string
}

export type FacebookEventPayload = {
  event_name: "Purchase" | "AddToCart" | "InitiateCheckout"
  event_time: number
  action_source: "website"
  event_source_url?: string
  event_id: string
  user_data: FacebookUserData
  custom_data?: FacebookCustomData
}

export type FacebookCapiRequest = {
  data: FacebookEventPayload[]
  test_event_code?: string
}

export type DomainEventType = "purchase" | "add_to_cart" | "initiate_checkout"

export type BaseDomainEvent = {
  id?: string
  event_id?: string
  created_at?: string | Date
  updated_at?: string | Date
  currency_code?: string
  customer_id?: string
  customer?: {
    email?: string
    phone?: string
    id?: string
  }
  email?: string
  phone?: string
  context?: {
    ip?: string
    user_agent?: string
    event_source_url?: string
  }
  metadata?: Record<string, unknown>
}
