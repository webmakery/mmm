import {
  authenticate,
  defineMiddlewares,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http"
import { createFindParams } from "@medusajs/medusa/api/utils/validators"
import multer from "multer"
import bodyParser from "body-parser"
import { z } from "zod"
import { UpsertProductBuilderSchema } from "./admin/products/[id]/builder/route"
import { GetComplementaryProductsSchema } from "./admin/products/complementary/route"
import { PostInvoiceConfgSchema } from "./admin/invoice-config/route"
import { GetAdminReviewsSchema } from "./admin/reviews/route"
import { AdminCreateSubscriptionPlanSchema } from "./admin/subscription-plans/route"
import { AdminUpdateSubscriptionPlanSchema } from "./admin/subscription-plans/[id]/route"
import { PostAdminUpdateReviewsStatusSchema } from "./admin/reviews/status/route"
import { createDigitalProductsSchema } from "./validation-schemas"
import { AddBuilderProductSchema } from "./store/carts/[id]/product-builder/route"
import { GetStoreReviewsSchema } from "./store/products/[id]/reviews/route"
import { PostStoreReviewSchema } from "./store/reviews/route"
import { PostStoreSyncSubscriptionSchema } from "./store/customers/me/subscriptions/sync/route"
import { PostAdminRetryInfrastructureSchema } from "./admin/subscriptions/[id]/infrastructure/retry/route"
import { GetAdminInboxConversationsSchema } from "./admin/inbox/conversations/route"
import { PatchAdminInboxConversationSchema } from "./admin/inbox/conversations/[id]/route"
import {
  GetAdminInboxConversationMessagesSchema,
  PostAdminInboxConversationMessageSchema,
} from "./admin/inbox/conversations/[id]/messages/route"
import { PostAdminCustomDomainsSchema } from "./admin/custom-domains/route"
import { PostAdminStoreBrandingSchema } from "./admin/store-branding/route"
import { PostAdminCreateLeadSchema, GetAdminLeadsSchema } from "./admin/leads/route"
import { PostAdminUpdateLeadSchema } from "./admin/leads/[id]/route"
import { PostAdminLeadActivitySchema } from "./admin/leads/[id]/activities/route"
import { PostAdminMoveLeadStageSchema } from "./admin/leads/[id]/move-stage/route"
import { PostAdminConvertLeadSchema } from "./admin/leads/[id]/convert/route"
import { PostAdminCreateLeadStageSchema } from "./admin/lead-stages/route"
import {
  GetStoreWebChatSessionSchema,
  PostStoreWebChatSessionSchema,
} from "./store/inbox/web-chat/session/route"
import {
  GetStoreWebChatMessagesSchema,
  PostStoreWebChatMessageSchema,
} from "./store/inbox/web-chat/messages/route"

export const GetSubscriptionsSchema = createFindParams()
export const GetSubscriptionPlansSchema = createFindParams()
const upload = multer({ storage: multer.memoryStorage() })

export default defineMiddlewares({
  routes: [
    {
      matcher: "/hooks/stripe",
      methods: ["POST"],
      middlewares: [bodyParser.raw({ type: "application/json" })],
    },
    {
      matcher: "/webhooks/whatsapp",
      methods: ["POST"],
      middlewares: [bodyParser.json({ type: "application/json" })],
    },
    {
      matcher: "/webhooks/telegram",
      methods: ["POST"],
      middlewares: [bodyParser.json({ type: "application/json" })],
    },
    {
      matcher: "/product-feed",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(
          z.object({
            currency_code: z.string(),
            country_code: z.string(),
          }),
          {}
        ),
      ],
    },
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
            "stripe_customer_id",
            "stripe_subscription_id",
            "stripe_price_id",
            "stripe_product_id",
            "metadata.*",
            "orders.*",
            "customer.*",
          ],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/subscriptions/:id/infrastructure/retry",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminRetryInfrastructureSchema)],
    },
    {
      matcher: "/admin/leads",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminLeadsSchema, { isList: true }),
      ],
    },
    {
      matcher: "/admin/leads",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminCreateLeadSchema)],
    },
    {
      matcher: "/admin/leads/:id",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminUpdateLeadSchema)],
    },
    {
      matcher: "/admin/leads/:id/activities",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminLeadActivitySchema)],
    },
    {
      matcher: "/admin/leads/:id/move-stage",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminMoveLeadStageSchema)],
    },
    {
      matcher: "/admin/leads/:id/convert",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminConvertLeadSchema)],
    },
    {
      matcher: "/admin/lead-stages",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminCreateLeadStageSchema)],
    },
    {
      matcher: "/admin/custom-domains",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminCustomDomainsSchema)],
    },
    {
      matcher: "/admin/store-branding",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminStoreBrandingSchema)],
    },
    {
      matcher: "/admin/inbox/conversations",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetAdminInboxConversationsSchema, {
          isList: true,
          defaults: [
            "id",
            "provider",
            "status",
            "customer_identifier",
            "last_message_at",
            "created_at",
            "updated_at",
            "channel_account.*",
            "participants.*",
          ],
        }),
      ],
    },
    {
      matcher: "/admin/inbox/conversations/:id/messages",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(GetAdminInboxConversationMessagesSchema, { isList: true })],
    },
    {
      matcher: "/admin/inbox/conversations/:id",
      methods: ["PATCH"],
      middlewares: [validateAndTransformBody(PatchAdminInboxConversationSchema)],
    },
    {
      matcher: "/admin/inbox/conversations/:id/messages",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostAdminInboxConversationMessageSchema)],
    },
    {
      matcher: "/admin/subscription-plans",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(GetSubscriptionPlansSchema, {
          defaults: [
            "id",
            "name",
            "stripe_product_id",
            "stripe_price_id",
            "interval",
            "active",
            "metadata",
            "created_at",
            "updated_at",
          ],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/subscription-plans",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminCreateSubscriptionPlanSchema)],
    },
    {
      matcher: "/admin/subscription-plans/:id",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AdminUpdateSubscriptionPlanSchema)],
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
      matcher: "/admin/digital-products",
      methods: ["GET"],
      middlewares: [
        validateAndTransformQuery(createFindParams(), {
          defaults: [
            "id",
            "name",
            "created_at",
            "updated_at",
            "deleted_at",
            "medias.*",
            "product_variant.*",
          ],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/digital-products",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(createDigitalProductsSchema)],
    },
    {
      matcher: "/admin/digital-products/upload*",
      methods: ["POST"],
      middlewares: [upload.array("files")],
    },
    {
      matcher: "/store/carts/:id/product-builder",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(AddBuilderProductSchema)],
    },
    {
      matcher: "/store/inbox/web-chat/session",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(GetStoreWebChatSessionSchema, {})],
    },
    {
      matcher: "/store/inbox/web-chat/session",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreWebChatSessionSchema)],
    },
    {
      matcher: "/store/inbox/web-chat/messages",
      methods: ["GET"],
      middlewares: [validateAndTransformQuery(GetStoreWebChatMessagesSchema, {})],
    },
    {
      matcher: "/store/inbox/web-chat/messages",
      methods: ["POST"],
      middlewares: [validateAndTransformBody(PostStoreWebChatMessageSchema)],
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
      matcher: "/store/customers/me/subscriptions/sync",
      methods: ["POST"],
      middlewares: [
        authenticate("customer", ["bearer", "session"]),
        validateAndTransformBody(PostStoreSyncSubscriptionSchema),
      ],
    },

    {
      matcher: "/store/customers/me/subscriptions/portal",
      methods: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
    {
      matcher: "/store/subscription-plans/:id/checkout-session",
      methods: ["POST"],
      middlewares: [authenticate("customer", ["bearer", "session"])],
    },
  ],
})
