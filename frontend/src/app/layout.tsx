import { getBaseURL } from "@lib/util/env"
import { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import "styles/globals.css"
import MetaPixelProvider from "@modules/layout/components/meta-pixel-provider"
import CookieConsent from "@modules/layout/components/cookie-consent"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
}

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" data-mode="light">
      <body className={`${inter.className} ${inter.variable} ${robotoMono.variable}`}>
        <MetaPixelProvider />
        <main className="relative">{props.children}</main>
        <CookieConsent />
      </body>
    </html>
  )
}
