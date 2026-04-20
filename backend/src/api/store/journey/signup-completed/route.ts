import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { CUSTOMER_JOURNEY_MODULE } from "../../../../modules/customer-journey"
import CustomerJourneyModuleService from "../../../../modules/customer-journey/service"

export const PostStoreJourneySignupCompletedSchema = z.object({
  anonymous_id: z.string().min(1),
  session_id: z.string().optional(),
  customer_id: z.string().min(1),
  event_id: z.string().optional(),
  idempotency_key: z.string().optional(),
  page_url: z.string().optional(),
  referrer: z.string().optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_term: z.string().optional(),
  utm_content: z.string().optional(),
})

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payload = PostStoreJourneySignupCompletedSchema.parse(req.body ?? {})
  const service: CustomerJourneyModuleService = req.scope.resolve(CUSTOMER_JOURNEY_MODULE)
  const result = await service.ingestEvent({
    ...payload,
    event_name: "signup_completed",
    event_source: "store_route",
  })

  return res.status(200).json({ ok: true, ...result })
}
