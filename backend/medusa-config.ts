import {
  loadEnv,
  defineConfig,
  Modules,
  ContainerRegistrationKeys,
} from "@medusajs/framework/utils"
import { getMetaConfigFromEnv } from './src/modules/facebook-capi/config'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const metaConfig = getMetaConfigFromEnv(process.env)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/digital-product",
    },
    {
      resolve: "./src/modules/subscription",
    },
    {
      resolve: "./src/modules/subscription-plan",
    },
    {
      resolve: "./src/modules/subscription-infrastructure",
    },
    {
      resolve: "./src/modules/custom-domain",
    },
    {
      resolve: "@medusajs/medusa/auth",
      dependencies: [Modules.CACHE, ContainerRegistrationKeys.LOGGER],
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/auth-emailpass",
            id: "emailpass",
          },
          {
            resolve: "@medusajs/medusa/auth-google",
            id: "google",
            options: {
              clientId: process.env.GOOGLE_CLIENT_ID,
              clientSecret: process.env.GOOGLE_CLIENT_SECRET,
              callbackUrl: process.env.GOOGLE_CALLBACK_URL,
            },
          },
          {
            resolve: "medusa-auth-facebook",
            id: "facebook",
            options: {
              clientId: process.env.FACEBOOK_CLIENT_ID,
              clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
              callbackUrl: process.env.FACEBOOK_CALLBACK_URL,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/digital-product-fulfillment",
            id: "digital",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          {
            resolve: "@perseidesjs/notification-nodemailer/providers/nodemailer",
            id: "nodemailer",
            options: {
              channels: ["email"],
              from: process.env.SMTP_FROM,
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: Number(process.env.SMTP_PORT || 587) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/paypal",
            id: "paypal",
            options: {
              client_id: process.env.PAYPAL_CLIENT_ID!,
              client_secret: process.env.PAYPAL_CLIENT_SECRET!,
              environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
              autoCapture: process.env.PAYPAL_AUTO_CAPTURE === "true",
              webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            },
          },
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/facebook-capi",
      options: metaConfig,
    },
    {
      resolve: "./src/modules/product-builder",
    },
    {
      resolve: "./src/modules/invoice-generator",
    },
    {
      resolve: "./src/modules/product-review",
    },
    {
      resolve: "./src/modules/inbox",
    },
    {
      resolve: "./src/modules/lead",
    },
    {
      resolve: "./src/modules/booking",
    },
  ],
})
