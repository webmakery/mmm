import { Metadata } from "next"

import StartForFreeLanding from "@modules/home/components/start-for-free"

export const metadata: Metadata = {
  title: "Kostenlos starten",
  description:
    "Starte deinen Online‑Shop mit geführtem Setup und teste Webmakerr ohne Risiko.",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function StartForFreePage({ params }: Props) {
  const { countryCode } = await params

  return <StartForFreeLanding countryCode={countryCode} />
}
