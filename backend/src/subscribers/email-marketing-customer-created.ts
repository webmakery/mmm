import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { Modules } from "@medusajs/framework/utils"
import { EMAIL_MARKETING_MODULE } from "../modules/email-marketing"
import EmailMarketingModuleService from "../modules/email-marketing/service"
import {
  ACCOUNT_CREATED_TAG,
  extractTagsFromMetadata,
  mergeTags,
  tagsToRecord,
} from "../modules/email-marketing/tag-utils"

type CustomerCreatedEvent = {
  id: string
}

export default async function emailMarketingCustomerCreated({
  event,
  container,
}: SubscriberArgs<CustomerCreatedEvent>) {
  const logger = container.resolve("logger")
  const customerService = container.resolve(Modules.CUSTOMER)
  const emailMarketingService: EmailMarketingModuleService = container.resolve(EMAIL_MARKETING_MODULE)

  const customer = await customerService.retrieveCustomer(event.data.id)

  if (!customer?.email) {
    logger.info(`[email-marketing] customer.created skipped: missing email for customer ${event.data.id}`)
    return
  }

  const customerMetadata = (customer.metadata as Record<string, unknown>) || {}
  const nextTags = mergeTags(extractTagsFromMetadata(customerMetadata), [ACCOUNT_CREATED_TAG])

  await customerService.updateCustomers({
    id: customer.id,
    metadata: {
      ...customerMetadata,
      tags: nextTags,
    },
  })

  await emailMarketingService.createOrUpdateSubscriber({
    email: customer.email,
    first_name: customer.first_name,
    last_name: customer.last_name,
    source: "customer.created",
    tags: tagsToRecord(nextTags),
    metadata: {
      customer_id: customer.id,
    },
  })

  logger.info(`[email-marketing] synced Account Created tag for customer ${customer.id}`)
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
