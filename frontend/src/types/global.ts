import { HttpTypes, StorePrice } from "@medusajs/types"

export type FeaturedProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string
}

export type VariantPrice = {
  calculated_price_number: number
  calculated_price: string
  original_price_number: number
  original_price: string
  currency_code: string
  price_type: string
  percentage_diff: string
}

export type StoreFreeShippingPrice = StorePrice & {
  target_reached: boolean
  target_remaining: number
  remaining_percentage: number
}

export type ProductBuilderCustomField = {
  id: string
  name: string
  type: string
  is_required: boolean
  description?: string | null
}

export type ProductBuilderComplementaryProduct = {
  id: string
  product_id: string
  product?: HttpTypes.StoreProduct
}

export type ProductBuilderAddon = {
  id: string
  product_id: string
  product?: HttpTypes.StoreProduct
}

export type ProductBuilder = {
  id: string
  custom_fields?: ProductBuilderCustomField[]
  complementary_products?: ProductBuilderComplementaryProduct[]
  addons?: ProductBuilderAddon[]
}

export type ProductWithBuilder = HttpTypes.StoreProduct & {
  product_builder?: ProductBuilder | null
}

export type CustomFieldValue = Record<string, string>

export type ComplementarySelection = Record<string, string | undefined>

export type AddonSelection = {
  product_id: string
  variant_id: string
  title: string
  thumbnail?: string | null
  price: number
  quantity: number
}

export type BuilderConfiguration = {
  customFields: CustomFieldValue
  complementaryProducts: ComplementarySelection
  addons: AddonSelection[]
}
