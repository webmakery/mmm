import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"
import CustomerJourneyModuleService from "../modules/customer-journey/service"

type PaymentCapturedEvent = {
  id?: string
  payment_id?: string
  order_id?: string
  customer_id?: string | null
}

export default async function customerJourneyPaymentCaptured({ event, container }: SubscriberArgs<PaymentCapturedEvent>) {
  let customerId = event.data.customer_id ?? null
  const query = container.resolve("query")

  if (!customerId && event.data.order_id) {
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: ["id", "customer_id"],
      filters: {
        id: event.data.order_id,
      },
    })

    customerId = order?.customer_id ?? null
  }

  const paymentIdentifier = event.data.payment_id || event.data.id || "unknown"

  if (!customerId && paymentIdentifier !== "unknown") {
    const {
      data: [payment],
    } = await query.graph({
      entity: "payment",
      fields: ["id", "payment_collection.order_id", "payment_collection.order.customer_id"],
      filters: {
        id: paymentIdentifier,
      },
    })

    const paymentOrderId = payment?.payment_collection?.order_id
    customerId = payment?.payment_collection?.order?.customer_id ?? null
    event.data.order_id = event.data.order_id ?? paymentOrderId
  }

  if (!customerId) {
    return
  }

  const service: CustomerJourneyModuleService = container.resolve(CUSTOMER_JOURNEY_MODULE)

  await service.ingestEvent({
    anonymous_id: `customer:${customerId}`,
    customer_id: customerId,
    event_name: "payment_captured",
    event_id: `payment.captured:${paymentIdentifier}`,
    idempotency_key: `payment.captured:${paymentIdentifier}`,
    event_source: "subscriber:payment.captured",
    payload: {
      payment_id: event.data.payment_id,
      order_id: event.data.order_id,
      source_of_truth: true,
    },
  })
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
