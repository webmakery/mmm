import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"
import CustomerJourneyModuleService from "../modules/customer-journey/service"

type PaymentCapturedEvent = {
  id: string
}

export default async function customerJourneyPaymentCaptured({ event, container }: SubscriberArgs<PaymentCapturedEvent>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const {
    data: [payment],
  } = await query.graph({
    entity: "payment",
    fields: [
      "id",
      "payment_collection.order.id",
      "payment_collection.order.customer_id",
      "payment_collection.order.email",
    ],
    filters: {
      id: event.data.id,
    },
  })

  const customerId = payment?.payment_collection?.order?.customer_id

  if (!customerId) {
    logger.info(`[customer-journey] payment.captured skipped: no customer_id for payment ${event.data.id}`)
    return
  }

  const service: CustomerJourneyModuleService = container.resolve(CUSTOMER_JOURNEY_MODULE)
  const orderId = payment?.payment_collection?.order?.id

  await service.ingestEvent({
    anonymous_id: `customer:${customerId}`,
    customer_id: customerId,
    event_name: "payment_captured",
    event_id: `payment.captured:${event.data.id}`,
    idempotency_key: `payment.captured:${event.data.id}`,
    event_source: "subscriber:payment.captured",
    payload: {
      payment_id: event.data.id,
      order_id: orderId,
      source_of_truth: true,
    },
  })

  logger.info(`[customer-journey] payment.captured ingested for payment ${event.data.id}`)
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
