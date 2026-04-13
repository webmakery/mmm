import { validateAndTransformQuery } from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"

const GetDigitalProductsSchema = createFindParams()

export default [
  {
    matcher: "/admin/digital-products",
    method: "GET",
    middlewares: [validateAndTransformQuery(GetDigitalProductsSchema, {})],
  },
]
