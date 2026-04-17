import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { addLeadActivityWorkflow, scheduleFollowUpWorkflow } from "../../../../../workflows/lead"

export const PostAdminLeadActivitySchema = z.object({
  type: z.enum(["note", "call", "email", "meeting", "task", "status_change"]),
  content: z.string(),
  created_by: z.string().optional(),
  due_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  set_as_next_follow_up: z.boolean().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminLeadActivitySchema>>,
  res: MedusaResponse
) {
  const body = req.validatedBody

  if (body.type === "task" && body.due_at && body.set_as_next_follow_up) {
    const { result } = await scheduleFollowUpWorkflow(req.scope).run({
      input: {
        id: req.params.id,
        due_at: body.due_at,
        created_by: body.created_by,
        content: body.content,
      },
    })

    res.json(result)
    return
  }

  const { result } = await addLeadActivityWorkflow(req.scope).run({
    input: {
      lead_id: req.params.id,
      type: body.type,
      content: body.content,
      created_by: body.created_by,
      due_at: body.due_at,
      completed_at: body.completed_at,
    },
  })

  res.json(result)
}
