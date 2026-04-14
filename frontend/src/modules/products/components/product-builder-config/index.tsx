"use client"

import { listProducts } from "@lib/data/products"
import { useEffect, useMemo, useState } from "react"
import {
  AddonSelection,
  BuilderConfiguration,
  ComplementarySelection,
  CustomFieldValue,
  ProductWithBuilder,
} from "types/global"
import VariantSelector from "./variant-selector"

type ProductBuilderConfigProps = {
  product: ProductWithBuilder
  countryCode: string
  onConfigurationChange: (config: BuilderConfiguration) => void
  onValidationChange: (isValid: boolean) => void
}

export default function ProductBuilderConfig({
  product,
  countryCode,
  onConfigurationChange,
  onValidationChange,
}: ProductBuilderConfigProps) {
  const [customFields, setCustomFields] = useState<CustomFieldValue>({})
  const [complementaryProducts, setComplementaryProducts] =
    useState<ComplementarySelection>({})
  const [addons, setAddons] = useState<AddonSelection[]>([])
  const [isLoadingPrices, setIsLoadingPrices] = useState(false)
  const [productPrices, setProductPrices] = useState<Record<string, ProductWithBuilder>>({})

  const builder = product.product_builder

  const relatedProductIds = useMemo(() => {
    const complementaryIds =
      builder?.complementary_products?.map((item) => item.product_id) || []
    const addonIds = builder?.addons?.map((item) => item.product_id) || []

    return Array.from(new Set([...complementaryIds, ...addonIds]))
  }, [builder?.addons, builder?.complementary_products])

  useEffect(() => {
    const fetchPrices = async () => {
      if (!relatedProductIds.length) {
        setProductPrices({})
        return
      }

      setIsLoadingPrices(true)

      try {
        const { response } = await listProducts({
          countryCode,
          queryParams: {
            id: relatedProductIds,
            limit: relatedProductIds.length,
          },
        })

        const mappedProducts = response.products.reduce(
          (acc, current) => {
            acc[current.id] = current
            return acc
          },
          {} as Record<string, ProductWithBuilder>
        )

        setProductPrices(mappedProducts)
      } finally {
        setIsLoadingPrices(false)
      }
    }

    fetchPrices()
  }, [countryCode, relatedProductIds])

  const isValid = useMemo(() => {
    const requiredFields =
      builder?.custom_fields?.filter((field) => field.is_required) || []

    return requiredFields.every((field) => {
      const value = customFields[field.id]
      return typeof value === "string" && value.trim().length > 0
    })
  }, [builder?.custom_fields, customFields])

  useEffect(() => {
    onValidationChange(isValid)
  }, [isValid, onValidationChange])

  useEffect(() => {
    onConfigurationChange({
      customFields,
      complementaryProducts,
      addons,
    })
  }, [addons, complementaryProducts, customFields, onConfigurationChange])

  const handleCustomFieldChange = (fieldId: string, value: string) => {
    setCustomFields((prev) => ({
      ...prev,
      [fieldId]: value,
    }))
  }

  const toggleComplementaryProduct = (itemId: string, variantId: string) => {
    setComplementaryProducts((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === variantId ? undefined : variantId,
    }))
  }

  const toggleAddon = (
    itemProductId: string,
    productTitle: string,
    productThumbnail: string | null | undefined,
    variantId: string,
    variantTitle: string | null | undefined,
    variantPrice: number | null | undefined
  ) => {
    setAddons((prev) => {
      const existingAddon = prev.find(
        (addon) => addon.product_id === itemProductId
      )

      if (existingAddon?.variant_id === variantId) {
        return prev.filter((addon) => addon.product_id !== itemProductId)
      }

      const title = variantTitle
        ? `${productTitle} (${variantTitle})`
        : productTitle

      const nextAddon: AddonSelection = {
        product_id: itemProductId,
        variant_id: variantId,
        title,
        thumbnail: productThumbnail,
        price: variantPrice || 0,
        quantity: 1,
      }

      return [
        ...prev.filter((addon) => addon.product_id !== itemProductId),
        nextAddon,
      ]
    })
  }

  if (!builder) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4" data-testid="product-builder-config">
      {(builder.custom_fields?.length || 0) > 0 && (
        <div className="flex flex-col gap-y-4">
          {builder.custom_fields?.map((field) => (
            <div key={field.id} className="flex flex-col gap-y-2">
              <label htmlFor={field.id} className="text-sm">
                {field.name}
                {field.is_required ? " *" : ""}
              </label>
              <input
                id={field.id}
                value={customFields[field.id] || ""}
                onChange={(event) =>
                  handleCustomFieldChange(field.id, event.target.value)
                }
                className="bg-ui-bg-field shadow-borders-base rounded-rounded text-ui-fg-base h-10 px-3"
              />
            </div>
          ))}
        </div>
      )}

      {(builder.complementary_products?.length || 0) > 0 && (
        <div className="flex flex-col gap-y-3">
          <span className="text-sm">Complementary products</span>
          {builder.complementary_products?.map((item) => {
            const pricedProduct = productPrices[item.product_id] || item.product

            if (!pricedProduct?.variants?.length) {
              return null
            }

            return (
              <div key={item.id} className="flex flex-col gap-y-2">
                <span className="text-small-regular">{pricedProduct.title}</span>
                {pricedProduct.variants.map((variant) => (
                  <VariantSelector
                    key={variant.id}
                    variant={variant}
                    isSelected={complementaryProducts[item.id] === variant.id}
                    onToggle={(variantId) =>
                      toggleComplementaryProduct(item.id, variantId)
                    }
                    disabled={isLoadingPrices}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}

      {(builder.addons?.length || 0) > 0 && (
        <div className="flex flex-col gap-y-3">
          <span className="text-sm">Addon products</span>
          {builder.addons?.map((item) => {
            const pricedProduct = productPrices[item.product_id] || item.product

            if (!pricedProduct?.variants?.length) {
              return null
            }

            return (
              <div key={item.id} className="flex flex-col gap-y-2">
                <span className="text-small-regular">{pricedProduct.title}</span>
                {pricedProduct.variants.map((variant) => (
                  <VariantSelector
                    key={variant.id}
                    variant={variant}
                    isSelected={
                      addons.find(
                        (addon) =>
                          addon.product_id === item.product_id &&
                          addon.variant_id === variant.id
                      ) !== undefined
                    }
                    onToggle={(variantId) =>
                      toggleAddon(
                        item.product_id,
                        pricedProduct.title,
                        pricedProduct.thumbnail,
                        variantId,
                        variant.title,
                        variant.calculated_price?.calculated_amount
                      )
                    }
                    disabled={isLoadingPrices}
                  />
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
