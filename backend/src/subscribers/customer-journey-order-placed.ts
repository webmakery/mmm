import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"
import CustomerJourneyModuleService from "../modules/customer-journey/service"

type OrderPlacedEvent = {
  id: string
  customer_id?: string | null
  email?: string | null
}

export default async function customerJourneyOrderPlaced({ event, container }: SubscriberArgs<OrderPlacedEvent>) {
  const customerId = event.data.customer_id

  if (!customerId) {
    return
  }

  const service: CustomerJourneyModuleService = container.resolve(CUSTOMER_JOURNEY_MODULE)

  await service.ingestEvent({
    anonymous_id: `customer:${customerId}`,
    customer_id: customerId,
    event_name: "order_placed",
    event_id: `order.placed:${event.data.id}`,
    idempotency_key: `order.placed:${event.data.id}`,
    event_source: "subscriber:order.placed",
    payload: {
      order_id: event.data.id,
      email: event.data.email,
      source_of_truth: true,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
