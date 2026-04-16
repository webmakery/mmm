import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import { z } from "zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../../../../modules/subscription-infrastructure"
import SubscriptionInfrastructureModuleService from "../../../../../../modules/subscription-infrastructure/service"
import { retryInfrastructureProvisioning } from "../../../../../../services/subscription-infrastructure-provisioning"

export const PostAdminRetryInfrastructureSchema = z.object({
  server_type: z.string().trim().min(1).optional(),
  location: z.string().trim().min(1).optional(),
  image: z.string().trim().min(1).optional(),
})

type PostAdminRetryInfrastructureType = z.infer<
  typeof PostAdminRetryInfrastructureSchema
>

export const POST = async (
  req: AuthenticatedMedusaRequest<PostAdminRetryInfrastructureType>,
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

  const result = await retryInfrastructureProvisioning({
    container: req.scope as any,
    infrastructureId: subscriptionInfra.id,
    triggeredBy: "admin",
    actorId: req.auth_context?.actor_id,
    override: {
      server_type: req.validatedBody.server_type,
      location: req.validatedBody.location,
      image: req.validatedBody.image,
    },
    logger,
  })

  const infrastructure = await infraService.retrieveSubscriptionInfrastructure(
    subscriptionInfra.id
  )

  return res.json({
    result,
    infrastructure,
  })
}
