import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../../../../modules/subscription-infrastructure/service"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

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

  if (!infrastructure) {
    return res.json({
      subscription,
      infrastructure: null,
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
    attempt_history,
    admin_audit_trail,
  })
}
