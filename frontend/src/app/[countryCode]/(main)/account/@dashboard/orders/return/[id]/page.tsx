import { listReturnReasons, listReturnShippingOptions } from "@lib/data/returns"
import { retrieveOrder } from "@lib/data/orders"
import ReturnRequestTemplate from "@modules/account/templates/return-request-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return {
    title: `Return Request - Order #${order.display_id}`,
    description: `Request a return for your order`,
  }
}

export default async function ReturnRequestPage(props: Props) {
  const params = await props.params

  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    return notFound()
  }

  const [shippingOptions, returnReasons] = await Promise.all([
    listReturnShippingOptions((order as any).cart.id),
    listReturnReasons(),
  ])

  return (
    <ReturnRequestTemplate
      order={order}
      shippingOptions={shippingOptions}
      returnReasons={returnReasons}
    />
  )
}
