import { Metadata } from "next"

import LoginTemplate from "@modules/account/templates/login-template"
import { getStoreBranding } from "@lib/data/store-branding"

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your account.",
}

export default async function Login() {
  const branding = await getStoreBranding()

  return <LoginTemplate storeName={branding.store_name} storeLogoUrl={branding.store_logo_url} />
}
