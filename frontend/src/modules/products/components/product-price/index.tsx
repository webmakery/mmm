import { clx } from "@medusajs/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import { BuilderConfiguration, ProductWithBuilder } from "types/global"

const getBuilderTotal = (
  product: ProductWithBuilder,
  builderConfig?: BuilderConfiguration
) => {
  if (!builderConfig || !product.product_builder) {
    return 0
  }

  const selectedVariantIds = [
    ...(builderConfig.complementary_products || []).map((comp) => comp.variant_id),
    ...(builderConfig.addons || []).map((addon) => addon.variant_id),
  ]

  if (!selectedVariantIds.length) {
    return 0
  }

  const relatedProducts = [
    ...(product.product_builder.complementary_products || []).map((item) => item.product),
    ...(product.product_builder.addons || []).map((item) => item.product),
  ].filter(Boolean) as ProductWithBuilder[]

  return relatedProducts.reduce((sum, relatedProduct) => {
    const selectedVariant = relatedProduct.variants?.find((variant) =>
      selectedVariantIds.includes(variant.id)
    )

    return sum + (selectedVariant?.calculated_price?.calculated_amount || 0)
  }, 0)
}

export default function ProductPrice({
  product,
  variant,
  builderConfig,
}: {
  product: ProductWithBuilder
  variant?: HttpTypes.StoreProductVariant
  builderConfig?: BuilderConfiguration
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-gray-100 animate-pulse" />
  }

  const builderTotal = getBuilderTotal(product, builderConfig)
  const totalPrice = selectedPrice.calculated_price_number + builderTotal

  return (
    <div className="flex flex-col text-ui-fg-base">
      <span
        className={clx("text-xl-semi", {
          "text-ui-fg-interactive": selectedPrice.price_type === "sale",
        })}
      >
        {!variant && "From "}
        <span data-testid="product-price" data-value={totalPrice}>
          {convertToLocale({
            amount: totalPrice,
            currency_code: selectedPrice.currency_code,
          })}
        </span>
      </span>
      {selectedPrice.price_type === "sale" && (
        <>
          <p>
            <span className="text-ui-fg-subtle">Original: </span>
            <span
              className="line-through"
              data-testid="original-product-price"
              data-value={selectedPrice.original_price_number}
            >
              {selectedPrice.original_price}
            </span>
          </p>
          <span className="text-ui-fg-interactive">
            -{selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
