"use client"

import { getMetaBrowserIds, trackMetaEvent } from "@lib/analytics/meta"
import { resolveMetaValue } from "@lib/analytics/meta-value"
import { addToCart, trackMetaAddToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@medusajs/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"
import ProductBuilderConfig from "../product-builder-config"
import { hasProductBuilder } from "@lib/util/product"
import { BuilderConfiguration, ProductWithBuilder } from "types/global"

type ProductActionsProps = {
  product: ProductWithBuilder
  region: HttpTypes.StoreRegion
  disabled?: boolean
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt: any) => {
    acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [builderConfig, setBuilderConfig] = useState<BuilderConfiguration>({
    customFields: {},
    complementaryProducts: {},
    addons: {},
  })
  const [isBuilderConfigValid, setIsBuilderConfigValid] = useState(true)
  const countryCode = useParams().countryCode as string

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  // check if the selected variant is in stock
  const inStock = useMemo(() => {
    // If we don't manage inventory, we can always add to cart
    if (selectedVariant && !selectedVariant.manage_inventory) {
      return true
    }

    // If we allow back orders on the variant, we can add to cart
    if (selectedVariant?.allow_backorder) {
      return true
    }

    // If there is inventory available, we can add to cart
    if (
      selectedVariant?.manage_inventory &&
      (selectedVariant?.inventory_quantity || 0) > 0
    ) {
      return true
    }

    // Otherwise, we can't add to cart
    return false
  }, [selectedVariant])

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  const hasBuilder = hasProductBuilder(product)

  // add the selected variant to the cart
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return null

    setIsAdding(true)

    const quantity = 1
    const price = selectedVariant.calculated_price?.calculated_amount
    // Store API `calculated_amount` is already a decimal currency value (e.g. 10.00 EUR).
    const normalizedItemPrice = resolveMetaValue({
      medusaMinorUnitValue: price,
      medusaValueIsMinorUnit: false,
    })
    const normalizedValue =
      typeof normalizedItemPrice === "number" ? normalizedItemPrice * quantity : undefined

    const eventPayload = {
      content_ids: [selectedVariant.id],
      contents: [
        {
          id: selectedVariant.id,
          quantity,
          item_price: normalizedItemPrice,
        },
      ],
      content_type: "product",
      currency: selectedVariant.calculated_price?.currency_code?.toUpperCase(),
      value: normalizedValue,
      num_items: quantity,
    }

    await addToCart({
      variantId: selectedVariant.id,
      quantity,
      countryCode,
    })

    const trackedEvent = trackMetaEvent("AddToCart", eventPayload)

    if (trackedEvent) {
      const browserIds = getMetaBrowserIds()

      await trackMetaAddToCart({
        event_id: trackedEvent.eventId,
        event_source_url: typeof window !== "undefined" ? window.location.href : undefined,
        _fbp: browserIds.fbp,
        _fbc: browserIds.fbc,
        ...browserIds,
        ...eventPayload,
      }).catch((error) => {
        if (process.env.NODE_ENV !== "production") {
          console.error("[meta/server-forward] failed", error)
        }
      })
    }

    setIsAdding(false)
  }

  return (
    <>
      <div className="flex flex-col gap-y-2" ref={actionsRef}>
        <div>
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex flex-col gap-y-4">
              {(product.options || []).map((option) => {
                return (
                  <div key={option.id}>
                    <OptionSelect
                      option={option}
                      current={options[option.id]}
                      updateOption={setOptionValue}
                      title={option.title ?? ""}
                      data-testid="product-options"
                      disabled={!!disabled || isAdding}
                    />
                  </div>
                )
              })}
              <Divider />
            </div>
          )}
        </div>

        {hasBuilder && (
          <ProductBuilderConfig
            product={product}
            countryCode={countryCode}
            onConfigurationChange={setBuilderConfig}
            onValidationChange={setIsBuilderConfigValid}
          />
        )}

        <ProductPrice
          product={product}
          variant={selectedVariant}
          builderConfig={builderConfig}
        />

        <Button
          onClick={handleAddToCart}
          disabled={
            !inStock ||
            !selectedVariant ||
            !!disabled ||
            isAdding ||
            !isValidVariant ||
            (hasBuilder && !isBuilderConfigValid)
          }
          variant="primary"
          className="w-full h-10"
          isLoading={isAdding}
          data-testid="add-product-button"
        >
          {!selectedVariant && !options
            ? "Select variant"
            : hasBuilder && !isBuilderConfigValid
            ? "Complete required fields"
            : !inStock || !isValidVariant
            ? "Out of stock"
            : "Add to cart"}
        </Button>
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
        />
      </div>
    </>
  )
}
