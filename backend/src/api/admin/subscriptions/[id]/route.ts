import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_PLAN_MODULE } from "../../../../modules/subscription-plan"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )
  const subscriptionPlanModuleService = req.scope.resolve(SUBSCRIPTION_PLAN_MODULE) as {
    retrieveSubscriptionPlan: (id: string) => Promise<Record<string, unknown>>
  }

  const {
    data: [subscription],
  } = await query.graph({
    entity: "subscription",
    fields: ["*", "orders.*", "customer.*"],
    filters: {
      id: [req.params.id],
    },
  })

  if (!subscription) {
    return res.status(404).json({ message: "Subscription not found" })
  }

  const [infrastructure] = await infraService.listSubscriptionInfrastructures({
    stripe_subscription_id: subscription.stripe_subscription_id,
  })

  const subscriptionPlanId = infrastructure?.subscription_plan_id
  const subscriptionPlan = subscriptionPlanId
    ? await subscriptionPlanModuleService
        .retrieveSubscriptionPlan(String(subscriptionPlanId))
        .catch(() => null)
    : null

  if (!infrastructure) {
    return res.json({
      subscription,
      infrastructure: null,
      subscription_plan: subscriptionPlan,
      attempt_history: [],
      admin_audit_trail: [],
    })
  }

  const attempt_history = await infraService.listSubscriptionInfrastructureProvisionAttempts(
    { infrastructure_id: infrastructure.id },
    { order: { created_at: "DESC" } }
  )

  const admin_audit_trail = await infraService.listSubscriptionInfrastructureAdminAuditLogs(
    { infrastructure_id: infrastructure.id },
    { order: { created_at: "DESC" } }
  )

  res.json({
    subscription,
    infrastructure,
    subscription_plan: subscriptionPlan,
    attempt_history,
    admin_audit_trail,
  })
}
