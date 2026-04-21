import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

const TERMS_PATH = "/content/terms-of-use"

const normalizeStorefrontUrl = (value?: string) => {
  if (!value) {
    return null
  }

  return value.endsWith("/") ? value.slice(0, -1) : value
}

const getTermsUrl = () => {
  const storefrontUrl = normalizeStorefrontUrl(process.env.STOREFRONT_URL)

  if (!storefrontUrl) {
    return TERMS_PATH
  }

  return `${storefrontUrl}${TERMS_PATH}`
}

export async function GET(_req: MedusaRequest, res: MedusaResponse) {
  res.redirect(getTermsUrl(), 302)
}
