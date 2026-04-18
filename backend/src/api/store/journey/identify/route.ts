import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { CUSTOMER_JOURNEY_MODULE } from "../../../../modules/customer-journey"
import CustomerJourneyModuleService from "../../../../modules/customer-journey/service"

export const PostStoreJourneyIdentifySchema = z.object({
  anonymous_id: z.string().min(1),
  customer_id: z.string().min(1),
  session_id: z.string().optional(),
  source: z.string().optional(),
  metadata: z.record(z.any()).optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payload = PostStoreJourneyIdentifySchema.parse(req.body ?? {})
  const service: CustomerJourneyModuleService = req.scope.resolve(CUSTOMER_JOURNEY_MODULE)
  const result = await service.identifyUser(payload)
  return res.status(200).json({ ok: true, result })
}
