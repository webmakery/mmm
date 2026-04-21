import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { Modules } from "@medusajs/framework/utils"
import { INotificationModuleService } from "@medusajs/framework/types"
import { EMAIL_MARKETING_MODULE } from "../../../../../modules/email-marketing"
import EmailMarketingModuleService from "../../../../../modules/email-marketing/service"
import { dedupeTags, tagsToRecord } from "../../../../../modules/email-marketing/tag-utils"

export const PostAdminCustomerTagsSchema = z.object({
  tags: z.array(z.string().min(1)).default([]),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostAdminCustomerTagsSchema>>, res: MedusaResponse) {
  const customerService = req.scope.resolve(Modules.CUSTOMER)
  const emailMarketingService: EmailMarketingModuleService = req.scope.resolve(EMAIL_MARKETING_MODULE)
  const notificationModuleService: INotificationModuleService = req.scope.resolve(Modules.NOTIFICATION)

  const customer = await customerService.retrieveCustomer(req.params.id)
  const customerMetadata = (customer.metadata as Record<string, unknown>) || {}
  const nextTags = dedupeTags(req.validatedBody.tags)

  const updatedCustomer = await customerService.updateCustomers(req.params.id, {
    metadata: {
      ...customerMetadata,
      tags: nextTags,
    },
  })

  if (customer.email) {
    await emailMarketingService.createOrUpdateSubscriber({
      email: customer.email,
      first_name: customer.first_name,
      last_name: customer.last_name,
      source: "customer-admin",
      tags: tagsToRecord(nextTags),
      metadata: {
        customer_id: customer.id,
      },
      notification_module_service: notificationModuleService,
    })
  }

  res.json({ customer: updatedCustomer, tags: nextTags })
}
