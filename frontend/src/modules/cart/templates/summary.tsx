"use client"

import { Button, Heading, Text } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { requestQuoteForCart } from "@lib/data/quotes"
import { SubmitButton } from "@modules/checkout/components/submit-button"
import { useState } from "react"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart & {
    promotions: HttpTypes.StorePromotion[]
  }
  customer: HttpTypes.StoreCustomer | null
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart, customer }: SummaryProps) => {
  const step = getCheckoutStep(cart)
  const [quoteMessage, setQuoteMessage] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const requestQuote = async () => {
    setQuoteMessage(null)

    const response = await requestQuoteForCart(cart.id)
    setQuoteMessage(response)
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Heading level="h2" className="text-[2rem] leading-[2.75rem]">
        Summary
      </Heading>
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      {customer && (
        <form action={requestQuote} className="w-full">
          <SubmitButton
            variant="secondary"
            className="w-full h-10"
            data-testid="request-quote-button"
          >
            Request quote
          </SubmitButton>
        </form>
      )}
      {quoteMessage && (
        <Text
          className={quoteMessage.success ? "text-ui-fg-base" : "text-rose-500"}
          data-testid="request-quote-message"
        >
          {quoteMessage.message}
        </Text>
      )}
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-10">Go to checkout</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
