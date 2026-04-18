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
  const customerId = event.data.customer_id

  if (!customerId) {
    return
  }

  const paymentIdentifier = event.data.payment_id || event.data.id || "unknown"
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
