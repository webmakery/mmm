import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const offset = Number(req.filterableFields.offset ?? 0)
  const limit = Number(req.filterableFields.limit ?? 20)

  const { data, metadata } = await query.graph({
    entity: "digital_product",
    fields: ["*", "medias.*"],
    pagination: {
      skip: offset,
      take: limit,
    },
  })

  res.json({
    digital_products: data,
    count: metadata?.count ?? 0,
    offset: metadata?.skip ?? 0,
    limit: metadata?.take ?? limit,
  })
}
