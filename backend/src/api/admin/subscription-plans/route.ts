import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { z } from "@medusajs/framework/zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_PLAN_MODULE } from "../../../modules/subscription-plan"
import { SubscriptionPlanInterval } from "../../../modules/subscription-plan/models/subscription-plan"

export const AdminCreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1),
  stripe_product_id: z.string().min(1),
  stripe_price_id: z.string().min(1),
  interval: z.nativeEnum(SubscriptionPlanInterval),
  active: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional().nullable(),
})

type AdminCreateSubscriptionPlan = z.infer<typeof AdminCreateSubscriptionPlanSchema>

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: subscriptionPlans,
    metadata: { count, take, skip } = {},
  } = await query.graph({
    entity: "subscription_plan",
    ...req.queryConfig,
  })

  res.json({
    subscription_plans: subscriptionPlans,
    count,
    limit: take,
    offset: skip,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminCreateSubscriptionPlan>,
  res: MedusaResponse
) => {
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    createSubscriptionPlans: (data: Record<string, unknown>) => Promise<Record<string, unknown>[]>
  }

  const [subscriptionPlan] = await subscriptionPlanModuleService.createSubscriptionPlans({
    name: req.validatedBody.name,
    stripe_product_id: req.validatedBody.stripe_product_id,
    stripe_price_id: req.validatedBody.stripe_price_id,
    interval: req.validatedBody.interval,
    active: req.validatedBody.active,
    metadata: req.validatedBody.metadata ?? null,
  })

  res.status(201).json({
    subscription_plan: subscriptionPlan,
  })
}
