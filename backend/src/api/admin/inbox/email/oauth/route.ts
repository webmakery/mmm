import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const GetAdminInboxEmailOAuthSchema = z.object({
  state: z.string().min(8),
})

export async function GET(
  req: AuthenticatedMedusaRequest<z.infer<typeof GetAdminInboxEmailOAuthSchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const response = inboxService.getGmailAuthorizationUrl({
    state: req.validatedQuery.state,
  })

  return res.json(response)
}
