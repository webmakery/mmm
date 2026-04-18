import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { CUSTOMER_JOURNEY_MODULE } from "../../../../modules/customer-journey"
import CustomerJourneyModuleService from "../../../../modules/customer-journey/service"

export const PostStoreJourneyEventSchema = z.object({
  anonymous_id: z.string().min(1),
  session_id: z.string().min(1).optional(),
  event_name: z.string().min(1),
  event_id: z.string().min(1).optional(),
  idempotency_key: z.string().min(1).optional(),
  occurred_at: z.string().datetime().optional(),
  event_source: z.string().optional(),
  page_url: z.string().optional(),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  payload: z.record(z.any()).optional(),
}).strict()

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payload = PostStoreJourneyEventSchema.parse(req.body ?? {})
  const service: CustomerJourneyModuleService = req.scope.resolve(CUSTOMER_JOURNEY_MODULE)
  const result = await service.ingestEvent(payload)
  return res.status(200).json({ ok: true, ...result })
}
