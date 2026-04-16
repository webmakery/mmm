import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const PostAdminInboxEmailConnectSchema = z.object({
  code: z.string().min(10),
})

export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostAdminInboxEmailConnectSchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const response = await inboxService.connectGmailAccount({
    code: req.validatedBody.code,
  })

  return res.json(response)
}
