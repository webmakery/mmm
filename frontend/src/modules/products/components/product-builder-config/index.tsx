"use client"

import { listProducts } from "@lib/data/products"
import Input from "@modules/common/components/input"
import { useEffect, useMemo, useState } from "react"
import {
  BuilderConfiguration,
  BuilderCustomFieldValue,
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
  const [customFields, setCustomFields] = useState<BuilderCustomFieldValue[]>([])
  const [complementaryProducts, setComplementaryProducts] = useState<
    Record<string, string | undefined>
  >({})
  const [addons, setAddons] = useState<Record<string, string | undefined>>({})
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

  useEffect(() => {
    if (!builder) {
      onValidationChange(true)
      return
    }

    const requiredCustomFields = (builder.custom_fields || []).filter((field) => field.is_required)
    const customFieldsValid = requiredCustomFields.every((field) => {
      const fieldValue = customFields.find((cf) => cf.field_id === field.id)?.value
      return fieldValue !== undefined && fieldValue !== "" && fieldValue !== 0
    })

    onValidationChange(customFieldsValid)
  }, [customFields, builder, onValidationChange])

  useEffect(() => {
    onConfigurationChange({
      custom_fields: customFields,
      complementary_products: Object.values(complementaryProducts)
        .filter((variantId): variantId is string => Boolean(variantId))
        .map((variant_id) => ({ variant_id })),
      addons: Object.values(addons)
        .filter((variantId): variantId is string => Boolean(variantId))
        .map((variant_id) => ({ variant_id })),
    })
  }, [addons, complementaryProducts, customFields, onConfigurationChange])

  const handleCustomFieldChange = (fieldId: string, value: string | number) => {
    setCustomFields((prev) => {
      const existing = prev.find((field) => field.field_id === fieldId)
      if (existing) {
        return prev.map((field) =>
          field.field_id === fieldId ? { ...field, value } : field
        )
      }
      return [...prev, { field_id: fieldId, value }]
    })
  }

  const toggleComplementaryProduct = (itemId: string, variantId: string) => {
    setComplementaryProducts((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === variantId ? undefined : variantId,
    }))
  }

  const toggleAddon = (itemId: string, variantId: string) => {
    setAddons((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === variantId ? undefined : variantId,
    }))
  }

  if (!builder) {
    return null
  }

  return (
    <div className="flex flex-col gap-y-4" data-testid="product-builder-config">
      {(builder.custom_fields?.length || 0) > 0 && (
        <div className="flex flex-col gap-y-4">
          {(builder.custom_fields ?? []).map((field) => (
            <div key={field.id}>
              <Input
                name={field.id}
                label={field.name}
                required={field.is_required}
                value={String(
                  customFields.find((customField) => customField.field_id === field.id)?.value ||
                    ""
                )}
                onChange={(event) =>
                  handleCustomFieldChange(
                    field.id,
                    field.type === "number"
                      ? parseFloat(event.target.value) || 0
                      : event.target.value
                  )
                }
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
                    onToggle={(variantId) => toggleComplementaryProduct(item.id, variantId)}
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
                    isSelected={addons[item.id] === variant.id}
                    onToggle={(variantId) => toggleAddon(item.id, variantId)}
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
