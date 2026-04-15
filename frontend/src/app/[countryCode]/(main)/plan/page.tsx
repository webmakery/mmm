import { redirect } from "next/navigation"

export default async function PlanRedirectPage({
  params,
}: {
  params: Promise<{ countryCode: string }>
}) {
  const { countryCode } = await params

  redirect(`/${countryCode}/plans`)
}
