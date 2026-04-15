import { 
  AuthenticatedMedusaRequest, 
  MedusaResponse
} from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: [customer] } = await query.graph({
    entity: "customer",
    fields: [
      "subscriptions.*",
      "subscriptions.stripe_customer_id",
      "subscriptions.stripe_subscription_id",
      "subscriptions.stripe_price_id",
      "subscriptions.stripe_product_id",
    ],
    filters: {
      id: [req.auth_context.actor_id]
    }
  })

  res.json({
    subscriptions: customer.subscriptions
  })
}