import { Metadata } from "next"

import Landing1 from "@modules/home/components/landing1"

export const metadata: Metadata = {
  title: "Landing 1",
  description: "German Shopify-style landing page.",
}

export default function Landing1Page() {
  return <Landing1 />
}
