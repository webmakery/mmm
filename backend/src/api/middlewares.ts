import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { UpsertProductBuilderSchema } from "./admin/products/[id]/builder/route"
import { GetComplementaryProductsSchema } from "./admin/products/complementary/route"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import { AddBuilderProductSchema } from "./store/carts/[id]/product-builder/route"

export const GetSubscriptionsSchema = createFindParams()

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/subscriptions",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetSubscriptionsSchema, {
          defaults: [
            "id",
            "subscription_date",
            "expiration_date",
            "status",
            "metadata.*",
            "orders.*",
            "customer.*",
          ],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/products/:id/builder",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(UpsertProductBuilderSchema)],
    },
    {
      matcher: "/admin/products/complementary",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetComplementaryProductsSchema, {
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/products/addons",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          isList: true,
        }),
      ],
    },
    {
      matcher: "/store/carts/:id/product-builder",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AddBuilderProductSchema)],
    },
    {
      matcher: "/admin/invoice-config",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostInvoiceConfgSchema)],
    },

    {
      matcher: "/store/payment-methods/:account_holder_id",
      methods: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
  ],
})
