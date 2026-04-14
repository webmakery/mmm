import { loadEnv, defineConfig } from '@medusajs/framework/utils'
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
  ],
})
