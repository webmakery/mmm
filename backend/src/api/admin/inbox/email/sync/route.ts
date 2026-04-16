import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const PostAdminInboxEmailSyncSchema = z.object({
  account_email: z.string().email().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(20),
})

export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostAdminInboxEmailSyncSchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const response = await inboxService.syncGmailInbox({
    accountEmail: req.validatedBody.account_email,
    limit: req.validatedBody.limit,
  })

  return res.json(response)
}
