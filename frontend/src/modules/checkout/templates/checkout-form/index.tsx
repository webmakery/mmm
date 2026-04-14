import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods } from "@lib/data/payment"
import { cartRequiresShipping } from "@lib/util/cart-requires-shipping"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const requiresShipping = cartRequiresShipping(cart)
  const shippingMethods = requiresShipping
    ? await listCartShippingMethods(cart.id)
    : []
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")

  if (!paymentMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <Addresses
        cart={cart}
        customer={customer}
        requiresShipping={requiresShipping}
      />

      {requiresShipping && (
        <Shipping cart={cart} availableShippingMethods={shippingMethods} />
      )}

      <Payment
        cart={cart}
        availablePaymentMethods={paymentMethods}
        requiresShipping={requiresShipping}
      />

      <Review cart={cart} requiresShipping={requiresShipping} />
    </div>
  )
}
