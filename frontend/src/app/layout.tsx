import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import "styles/globals.css"
import MetaPixelProvider from "@modules/layout/components/meta-pixel-provider"
import CookieConsent from "@modules/layout/components/cookie-consent"

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body>
        <MetaPixelProvider />
        <main className="relative">{props.children}</main>
        <CookieConsent />
      </body>
    </html>
  )
}
