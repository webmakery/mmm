export type ProductBuilderBase = {
  id: string
  product_id: string
  created_at: string
  updated_at: string
}

export type CustomFieldBase = {
  id: string
  name: string
  type: "text" | "number"
  description?: string
  is_required: boolean
}

export type ComplementaryProductBase = {
  id: string
  product_id: string
  product?: {
    id: string
    title: string
  }
}

export type AddonProductBase = {
  id: string
  product_id: string
  product?: {
    id: string
    title: string
  }
}

// Product Builder API Response Types
export type ProductBuilderResponse = {
  product_builder: ProductBuilderBase & {
    custom_fields: CustomFieldBase[]
    complementary_products: ComplementaryProductBase[]
    addons: AddonProductBase[]
  }
}

// Form Data Types (for creating/updating)
export type CustomField = {
  id?: string
  name: string
  type: "text" | "number"
  description?: string
  is_required: boolean
}

export type ComplementaryProduct = {
  id?: string
  product_id: string
  product?: {
    id: string
    title: string
  }
}

export type AddonProduct = {
  id?: string
  product_id: string
  product?: {
    id: string
    title: string
  }
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELED = "canceled",
  EXPIRED = "expired",
  FAILED = "failed",
}

export enum SubscriptionInterval {
  MONTHLY = "monthly",
  YEARLY = "yearly",
}

export type SubscriptionData = {
  id: string
  status: SubscriptionStatus
  interval: SubscriptionInterval
  subscription_date: string
  last_order_date: string
  next_order_date: string | null
  expiration_date: string
  metadata: Record<string, unknown> | null
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  stripe_product_id: string | null
  orders?: { id: string; created_at: string }[]
  customer?: { id: string; email?: string | null }
}

export enum MediaType {
  MAIN = "main",
  PREVIEW = "preview",
}

export type DigitalProductMedia = {
  id: string
  type: MediaType
  fileId: string
  mimeType: string
  digitalProducts?: DigitalProduct
}

export type DigitalProduct = {
  id: string
  name: string
  medias?: DigitalProductMedia[]
  product_variant?: {
    id: string
    product_id: string
  }
}
