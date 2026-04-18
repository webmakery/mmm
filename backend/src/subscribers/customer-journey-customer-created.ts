import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"
import CustomerJourneyModuleService from "../modules/customer-journey/service"

export default async function customerJourneyCustomerCreated({ event, container }: SubscriberArgs<{ id: string; email?: string }>) {
  const service: CustomerJourneyModuleService = container.resolve(CUSTOMER_JOURNEY_MODULE)
  const customerId = event.data.id

  await service.ingestEvent({
    anonymous_id: `customer:${customerId}`,
    customer_id: customerId,
    event_name: "signup_completed",
    event_id: `customer.created:${customerId}`,
    idempotency_key: `customer.created:${customerId}`,
    event_source: "subscriber:customer.created",
    payload: {
      email: event.data.email,
      source_of_truth: true,
    },
  })

  await service.identifyUser({
    anonymous_id: `customer:${customerId}`,
    customer_id: customerId,
    source: "subscriber:customer.created",
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
