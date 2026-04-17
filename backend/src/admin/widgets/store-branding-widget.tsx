import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminStore, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Label, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ChangeEvent, useEffect, useState } from "react"
import { sdk } from "../lib/sdk"

type StoreBrandingResponse = {
  store_name: string
  store_logo_url: string | null
}

const StoreBrandingWidget = ({ data: _store }: DetailWidgetProps<AdminStore>) => {
  const [storeName, setStoreName] = useState("")
  const [storeLogoUrl, setStoreLogoUrl] = useState("")

  const { data, isLoading, refetch } = useQuery<StoreBrandingResponse>({
    queryKey: ["store-branding"],
    queryFn: () => sdk.client.fetch("/admin/store-branding"),
  })

  useEffect(() => {
    if (!data) {
      return
    }

    setStoreName(data.store_name || "")
    setStoreLogoUrl(data.store_logo_url || "")
  }, [data])

  const updateBrandingMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<StoreBrandingResponse>("/admin/store-branding", {
        method: "POST",
        body: {
          store_name: storeName,
          store_logo_url: storeLogoUrl || null,
        },
      }),
    onSuccess: () => {
      toast.success("Store branding updated")
      refetch()
    },
    onError: () => {
      toast.error("Failed to update store branding")
    },
  })

  const uploadLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      const { files } = await sdk.admin.upload.create({
        files: [file],
      })

      setStoreLogoUrl(files[0].url)
      toast.success("Logo uploaded")
    } catch {
      toast.error("Failed to upload logo")
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Store Branding</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Update store name and logo for storefront branding.
        </Text>
      </div>

      <div className="flex flex-col gap-4 px-6 py-4">
        <div className="flex flex-col gap-2">
          <Label size="small" weight="plus">
            Store Name
          </Label>
          <Input
            value={storeName}
            onChange={(event) => setStoreName(event.target.value)}
            placeholder="Store name"
            disabled={isLoading || updateBrandingMutation.isPending}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label size="small" weight="plus">
            Store Logo
          </Label>
          <Input
            type="file"
            onChange={uploadLogo}
            className="py-1"
            disabled={isLoading || updateBrandingMutation.isPending}
          />
          {storeLogoUrl ? <Input value={storeLogoUrl} readOnly /> : null}
        </div>

        <Button
          onClick={() => updateBrandingMutation.mutate()}
          isLoading={updateBrandingMutation.isPending}
          disabled={isLoading}
        >
          Save branding
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreBrandingWidget
