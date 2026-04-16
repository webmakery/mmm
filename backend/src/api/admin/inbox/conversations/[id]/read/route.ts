import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { INBOX_MODULE } from "../../../../../../modules/inbox"
import InboxModuleService from "../../../../../../modules/inbox/service"

export async function POST(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)

  await inboxService.markConversationAsRead(req.params.id)

  res.status(200).json({
    id: req.params.id,
    unread_count: 0,
  })
}
