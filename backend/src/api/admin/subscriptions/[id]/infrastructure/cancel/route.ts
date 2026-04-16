import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../../../../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../../../../../../modules/subscription-infrastructure/service"
import { markInfrastructureCancelled } from "../../../../../../services/subscription-infrastructure-provisioning"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const logger = req.scope.resolve("logger")
  const infraService = req.scope.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const {
    data: [subscription],
  } = await query.graph({
    entity: "subscription",
    fields: ["stripe_subscription_id"],
    filters: { id: [req.params.id] },
  })

  const [subscriptionInfra] = await infraService.listSubscriptionInfrastructures({
    stripe_subscription_id: subscription?.stripe_subscription_id,
  })

  if (!subscriptionInfra) {
    return res.status(404).json({ message: "Infrastructure not found" })
  }

  await markInfrastructureCancelled({
    container: req.scope as any,
    infrastructureId: subscriptionInfra.id,
    actorId: req.auth_context?.actor_id,
    logger,
  })

  const infrastructure = await infraService.retrieveSubscriptionInfrastructure(
    subscriptionInfra.id
  )

  return res.json({ infrastructure })
}
