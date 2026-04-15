import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { z } from "@medusajs/framework/zod"
import { SUBSCRIPTION_PLAN_MODULE } from "../../../../modules/subscription-plan"
import { SubscriptionPlanInterval } from "../../../../modules/subscription-plan/models/subscription-plan"

export const AdminUpdateSubscriptionPlanSchema = z.object({
  name: z.string().min(1).optional(),
  stripe_product_id: z.string().min(1).optional(),
  stripe_price_id: z.string().min(1).optional(),
  interval: z.nativeEnum(SubscriptionPlanInterval).optional(),
  active: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
})

type AdminUpdateSubscriptionPlan = z.infer<typeof AdminUpdateSubscriptionPlanSchema>

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSubscriptionPlan>,
  res: MedusaResponse
) => {
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    updateSubscriptionPlans: (data: Record<string, unknown>) => Promise<Record<string, unknown>[]>
  }

  const [subscriptionPlan] = await subscriptionPlanModuleService.updateSubscriptionPlans({
    id: req.params.id,
    ...req.validatedBody,
  })

  res.json({
    subscription_plan: subscriptionPlan,
  })
}
