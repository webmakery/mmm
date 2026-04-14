import {
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"

const GetDigitalProductsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/digital-products",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(GetDigitalProductsSchema, {})],
    },
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostInvoiceConfgSchema)
      ]
    }
  ]
})
