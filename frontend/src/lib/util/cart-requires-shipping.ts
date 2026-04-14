import { HttpTypes } from "@medusajs/types"

export function cartRequiresShipping(cart: HttpTypes.StoreCart | null) {
  if (!cart?.items?.length) {
    return false
  }

  return cart.items.some((item: any) => {
    if (item?.variant?.digital_product) {
      return false
    }

    if (typeof item?.requires_shipping === "boolean") {
      return item.requires_shipping
    }

    if (typeof item?.variant?.requires_shipping === "boolean") {
      return item.variant.requires_shipping
    }

    return true
  })
}
