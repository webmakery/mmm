import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

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
      resolve: "./src/modules/facebook-capi",
      options: {
        enabled: process.env.FACEBOOK_CAPI_ENABLED === "true",
        pixelId: process.env.FACEBOOK_CAPI_PIXEL_ID,
        accessToken: process.env.FACEBOOK_CAPI_ACCESS_TOKEN,
        testEventCode: process.env.FACEBOOK_CAPI_TEST_EVENT_CODE,
        apiVersion: process.env.FACEBOOK_CAPI_API_VERSION,
        timeoutMs: process.env.FACEBOOK_CAPI_TIMEOUT_MS
          ? Number(process.env.FACEBOOK_CAPI_TIMEOUT_MS)
          : undefined,
        maxRetries: process.env.FACEBOOK_CAPI_MAX_RETRIES
          ? Number(process.env.FACEBOOK_CAPI_MAX_RETRIES)
          : undefined,
      },
    },
  ],
})
