"use client"

import { HttpTypes } from "@medusajs/types"
import { clx } from "@medusajs/ui"
import { getPricesForVariant } from "@lib/util/get-product-price"
import { isVariantInStock } from "@lib/util/product"

type VariantSelectorProps = {
  variant: HttpTypes.StoreProductVariant
  isSelected: boolean
  onToggle: (variantId: string) => void
  disabled?: boolean
}

export default function VariantSelector({
  variant,
  isSelected,
  onToggle,
  disabled,
}: VariantSelectorProps) {
  const price = getPricesForVariant(variant)
  const inStock = isVariantInStock(variant)

  return (
    <button
      type="button"
      onClick={() => onToggle(variant.id)}
      disabled={disabled}
      className={clx(
        "border-ui-border-base bg-ui-bg-subtle border text-small-regular h-10 rounded-rounded p-2 w-full text-left flex items-center justify-between",
        {
          "border-ui-border-interactive": isSelected,
          "hover:shadow-elevation-card-rest transition-shadow ease-in-out duration-150":
            !isSelected,
          "opacity-50 cursor-not-allowed": disabled,
        }
      )}
    >
      <span className="truncate">{variant.title}</span>
      <span className="flex items-center gap-x-2">
        <span className="text-ui-fg-subtle">{inStock ? "In stock" : "Out of stock"}</span>
        {price?.calculated_price && <span>{price.calculated_price}</span>}
      </span>
    </button>
  )
}
