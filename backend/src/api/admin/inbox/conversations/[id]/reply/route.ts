import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../../modules/inbox"
import InboxModuleService from "../../../../../../modules/inbox/service"

export const PostAdminInboxConversationReplySchema = z.object({
  text: z.string().min(1),
})

export async function POST(
  req: AuthenticatedMedusaRequest<z.infer<typeof PostAdminInboxConversationReplySchema>>,
  res: MedusaResponse
) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)

  const response = await inboxService.sendConversationReply({
    conversationId: req.params.id,
    text: req.validatedBody.text,
  })

  res.status(200).json(response)
}
