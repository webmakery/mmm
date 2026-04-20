import { Metadata } from "next"

import StartForFreeLanding from "@modules/home/components/start-for-free"

export const metadata: Metadata = {
  title: "Start for free",
  description:
    "Launch your business with a polished storefront and start selling with a low-risk trial.",
}

export default function StartForFreePage() {
  return <StartForFreeLanding />
}
