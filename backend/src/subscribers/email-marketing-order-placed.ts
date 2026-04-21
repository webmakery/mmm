import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { EMAIL_MARKETING_MODULE } from "../modules/email-marketing"
import EmailMarketingModuleService from "../modules/email-marketing/service"
import {
  PURCHASED_TAG,
  extractTagsFromMetadata,
  mergeTags,
  tagsToRecord,
} from "../modules/email-marketing/tag-utils"

type OrderPlacedEvent = {
  id: string
}

export default async function emailMarketingOrderPlaced({ event, container }: SubscriberArgs<OrderPlacedEvent>) {
  const logger = container.resolve("logger")
  const query = container.resolve("query")
  const customerService = container.resolve(Modules.CUSTOMER)
  const emailMarketingService: EmailMarketingModuleService = container.resolve(EMAIL_MARKETING_MODULE)
  const notificationModuleService: INotificationModuleService = container.resolve(Modules.NOTIFICATION)

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: ["id", "email", "customer_id", "customer.id", "customer.email", "customer.first_name", "customer.last_name", "customer.metadata"],
    filters: {
      id: event.data.id,
    },
  })

  const customerId = order?.customer_id || order?.customer?.id
  const customerEmail = order?.customer?.email || order?.email

  if (!customerEmail) {
    logger.info(`[email-marketing] order.placed skipped: missing email for order ${event.data.id}`)
    return
  }

  const customerMetadata = (order?.customer?.metadata as Record<string, unknown>) || {}
  const nextTags = mergeTags(extractTagsFromMetadata(customerMetadata), [PURCHASED_TAG])

  if (customerId) {
    await customerService.updateCustomers(customerId, {
      metadata: {
        ...customerMetadata,
        tags: nextTags,
      },
    })
  }

  await emailMarketingService.createOrUpdateSubscriber({
    email: customerEmail,
    first_name: order?.customer?.first_name ?? null,
    last_name: order?.customer?.last_name ?? null,
    source: "order.placed",
    tags: tagsToRecord(nextTags),
    metadata: customerId
      ? {
          customer_id: customerId,
        }
      : undefined,
    notification_module_service: notificationModuleService,
  })

  logger.info(`[email-marketing] synced Purchased tag for order ${event.data.id}`)
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
