import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

type StoreBrandingResponse = {
  store_name: string
  store_logo_url: string | null
}

const LoginBrandingWidget = () => {
  const { data } = useQuery<StoreBrandingResponse>({
    queryKey: ["store-branding"],
    queryFn: () => sdk.client.fetch("/admin/store-branding"),
  })

  if (!data) {
    return null
  }

  return (
    <div className="mb-8 flex justify-center">
      {data.store_logo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={data.store_logo_url} alt={data.store_name} className="h-10 w-auto" />
      ) : (
        <h2 className="text-large-semi uppercase">{data.store_name}</h2>
      )}
    </div>
  )
}

export const config = defineWidgetConfig({
  zone: "login.before",
})

export default LoginBrandingWidget
