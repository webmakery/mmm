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
      resolve: "./src/modules/facebook-capi",
      options: metaConfig,
    },
    {
      resolve: "./src/modules/product-builder",
    },
  ],
})
