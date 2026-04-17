import { Metadata } from "next"
import EmailSignup from "@modules/account/components/email-signup"
import { getStoreBranding } from "@lib/data/store-branding"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your account.",
}

export default async function SignupPage() {
  const branding = await getStoreBranding()

  return (
    <EmailSignup
      storeName={branding.store_name}
      storeLogoUrl={branding.store_logo_url}
    />
  )
}
