import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { convertLeadToCustomerWorkflow } from "../../../../../workflows/lead"

export const PostAdminConvertLeadSchema = z.object({
  created_by: z.string().optional(),
})

export async function POST(
  req: MedusaRequest<z.infer<typeof PostAdminConvertLeadSchema>>,
  res: MedusaResponse
) {
  const { result } = await convertLeadToCustomerWorkflow(req.scope).run({
    input: {
      id: req.params.id,
      created_by: req.validatedBody.created_by,
    },
  })

  res.json(result)
}
