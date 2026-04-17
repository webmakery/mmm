import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { INBOX_MODULE } from "../../../../../modules/inbox"
import InboxModuleService from "../../../../../modules/inbox/service"

export const PostStoreWebChatSessionSchema = z.object({
  session_id: z.string().trim().min(1).optional(),
  name: z.string().trim().min(1),
  email: z.string().trim().email(),
  initial_message: z.string().trim().min(1).optional(),
})

export const GetStoreWebChatSessionSchema = z.object({
  session_id: z.string().trim().min(1),
})

export async function POST(req: MedusaRequest<z.infer<typeof PostStoreWebChatSessionSchema>>, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)

  const session = await inboxService.bootstrapWebChatSession({
    sessionId: req.validatedBody.session_id,
    name: req.validatedBody.name,
    email: req.validatedBody.email,
    initialMessage: req.validatedBody.initial_message,
  })

  return res.status(200).json({
    session,
  })
}

export async function GET(req: MedusaRequest<z.infer<typeof GetStoreWebChatSessionSchema>>, res: MedusaResponse) {
  const inboxService = req.scope.resolve<InboxModuleService>(INBOX_MODULE)
  const session = await inboxService.resolveWebChatSession(String(req.validatedQuery.session_id))

  if (!session) {
    return res.status(404).json({
      message: "Session not found",
    })
  }

  return res.status(200).json({ session })
}
