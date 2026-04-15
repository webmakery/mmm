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

type SubscriptionPlanRecord = Record<string, unknown>

const pickFirst = (result: SubscriptionPlanRecord | SubscriptionPlanRecord[]) => {
  return Array.isArray(result) ? result[0] : result
}

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    retrieveSubscriptionPlan: (id: string) => Promise<SubscriptionPlanRecord>
  }

  const subscriptionPlan = await subscriptionPlanModuleService.retrieveSubscriptionPlan(
    req.params.id
  )

  res.json({
    subscription_plan: subscriptionPlan,
  })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateSubscriptionPlan>,
  res: MedusaResponse
) => {
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    updateSubscriptionPlans: (
      data: SubscriptionPlanRecord
    ) => Promise<SubscriptionPlanRecord | SubscriptionPlanRecord[]>
  }

  const updateResult = await subscriptionPlanModuleService.updateSubscriptionPlans({
    id: req.params.id,
    ...req.validatedBody,
  })
  const subscriptionPlan = pickFirst(updateResult)

  res.json({
    subscription_plan: subscriptionPlan,
  })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    deleteSubscriptionPlans: (ids: string[] | string) => Promise<void>
  }

  await subscriptionPlanModuleService.deleteSubscriptionPlans([req.params.id])

  res.status(200).json({
    id: req.params.id,
    object: "subscription_plan",
    deleted: true,
  })
}
