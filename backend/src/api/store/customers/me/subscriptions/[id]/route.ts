import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import SubscriptionModuleService from "../../../../../../modules/subscription/service"
import {
  SUBSCRIPTION_MODULE,
} from "../../../../../../modules/subscription"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const subscriptionModuleService: SubscriptionModuleService =
    req.scope.resolve(SUBSCRIPTION_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: [subscription] } = await query.graph({
    entity: "subscription",
    fields: [
      "id",
      "customer.id",
    ],
    filters: {
      id: [req.params.id],
    },
  })

  if (!subscription) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "Subscription not found."
    )
  }

  if (subscription.customer?.id !== req.auth_context.actor_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "You are not allowed to cancel this subscription."
    )
  }

  const canceledSubscription = await subscriptionModuleService
    .cancelSubscriptions(req.params.id)

  res.json({
    subscription: canceledSubscription,
  })
}
