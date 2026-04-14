import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import { AdminCreateProduct } from "@medusajs/medusa/api/admin/products/validators"
import { UpsertProductBuilderSchema } from "./admin/products/[id]/builder/route"
import { GetComplementaryProductsSchema } from "./admin/products/complementary/route"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import { GetAdminReviewsSchema } from "./admin/reviews/route"
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route"
import { AddBuilderProductSchema } from "./store/carts/[id]/product-builder/route"
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostVendorCreateSchema } from "./vendors/route"

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
      matcher: "/store/reviews",
      methods: ["POST"],
      middlewares: [
        authenticate("customer", ["session", "bearer"]),
        validateAndTransformBody(PostStoreReviewSchema),
      ],
    },
    {
      matcher: "/store/products/:id/reviews",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetStoreReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "rating",
            "title",
            "first_name",
            "last_name",
            "content",
            "created_at",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/reviews",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminReviewsSchema, {
          isList: true,
          defaults: [
            "id",
            "title",
            "content",
            "rating",
            "product_id",
            "customer_id",
            "status",
            "created_at",
            "updated_at",
            "product.*",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/reviews/status",
      methods: ["POST"],
      middlewares: [
        validateAndTransformBody(PostAdminUpdateReviewsStatusSchema),
      ],
    },

    {
      matcher: "/store/payment-methods/:account_holder_id",
      methods: ["GET"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/vendors",
      methods: ["POST"],
      middlewares: [
        authenticate("vendor", ["session", "bearer"], {
          allowUnregistered: true,
        }),
        validateAndTransformBody(PostVendorCreateSchema),
      ],
    },
    {
      matcher: "/vendors/*",
      middlewares: [authenticate("vendor", ["session", "bearer"])],
    },
    {
      matcher: "/vendors/products",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateProduct)],
    },
  ],
})
