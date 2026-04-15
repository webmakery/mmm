import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: subscriptionPlans } = await query.graph({
    entity: "subscription_plan",
    fields: [
      "id",
      "name",
      "stripe_product_id",
      "stripe_price_id",
      "interval",
      "active",
      "metadata",
    ],
    filters: {
      active: true,
    },
  })

  res.json({
    subscription_plans: subscriptionPlans,
  })
}
