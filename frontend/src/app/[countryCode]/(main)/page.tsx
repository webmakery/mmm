import { Metadata } from "next"

import Hero from "@modules/home/components/hero"

export const metadata: Metadata = {
  title: "Storefront",
  description: "A performant frontend ecommerce storefront.",
}

export default function Home() {
  return <Hero />
}
