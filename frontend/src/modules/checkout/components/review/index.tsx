"use client"

import { Heading, Text, clx } from "@medusajs/ui"

import PaymentButton from "../payment-button"
import { useSearchParams } from "next/navigation"

const Review = ({
  cart,
  requiresShipping,
}: {
  cart: any
  requiresShipping: boolean
}) => {
  const searchParams = useSearchParams()

  const isOpen = searchParams.get("step") === "review"

  const paidByGiftcard =
    cart?.gift_cards && cart?.gift_cards?.length > 0 && cart?.total === 0

  const hasCheckoutAddress = Boolean(
    cart?.shipping_address || (!requiresShipping && cart?.billing_address)
  )

  const previousStepsCompleted =
    hasCheckoutAddress &&
    (!requiresShipping || cart.shipping_methods.length > 0) &&
    (cart.payment_collection || paidByGiftcard)

  return (
    <div className="bg-white">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none": !isOpen,
            }
          )}
        >
          Review
        </Heading>
      </div>
      {isOpen && previousStepsCompleted && (
        <>
          <div className="flex items-start gap-x-1 w-full mb-6">
            <div className="w-full">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                By clicking the Place Order button, you confirm that you have
                read, understand and accept our Terms of Use, Terms of Sale and
                Returns Policy and acknowledge that you have read our Privacy
                Policy.
              </Text>
            </div>
          </div>
          <PaymentButton
            cart={cart}
            requiresShipping={requiresShipping}
            data-testid="submit-order-button"
          />
        </>
      )}
    </div>
  )
}

export default Review
