import { HttpTypes } from "@medusajs/types"
import { ProductWithBuilder } from "types/global"

export const isSimpleProduct = (product: HttpTypes.StoreProduct): boolean => {
  return (
    product.options?.length === 1 && product.options[0].values?.length === 1
  )
}

export const isVariantInStock = (
  variant?: HttpTypes.StoreProductVariant
): boolean => {
  if (!variant) {
    return false
  }

  if (!variant.manage_inventory) {
    return true
  }

  if (variant.allow_backorder) {
    return true
  }

  return (variant.inventory_quantity || 0) > 0
}

export const hasProductBuilder = (product: ProductWithBuilder): boolean => {
  const builder = product.product_builder

  if (!builder) {
    return false
  }

  return (
    (builder.custom_fields?.length || 0) > 0 ||
    (builder.complementary_products?.length || 0) > 0 ||
    (builder.addons?.length || 0) > 0
  )
}
