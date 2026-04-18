import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"
import CustomerJourneyModuleService from "../modules/customer-journey/service"

type OrderPlacedEvent = {
  id: string
}

export default async function customerJourneyOrderPlaced({ event, container }: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "customer_id", "email"],
    filters: {
      id: event.data.id,
    },
  })

  const customerId = order?.customer_id

  if (!customerId) {
    logger.info(`[customer-journey] order.placed skipped: no customer_id for order ${event.data.id}`)
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
      email: order?.email,
      source_of_truth: true,
    },
  })

  logger.info(`[customer-journey] order.placed ingested for order ${event.data.id}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
