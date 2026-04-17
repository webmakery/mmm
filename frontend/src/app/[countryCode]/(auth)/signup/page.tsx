import { Metadata } from "next"
import EmailSignup from "@modules/account/components/email-signup"
import { getStoreBranding } from "@lib/data/store-branding"
import { listRegions } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create your account.",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function SignupPage({ params }: Props) {
  const { countryCode } = await params

  const [branding, regions] = await Promise.all([
    getStoreBranding(),
    listRegions().then((storeRegions) => storeRegions ?? []),
  ])

  return (
    <EmailSignup
      storeName={branding.store_name}
      countryCode={countryCode}
      regions={regions}
    />
  )
}
