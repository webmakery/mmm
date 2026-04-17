import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminStore, DetailWidgetProps } from "@medusajs/framework/types"
import {
  Badge,
  Button,
  Container,
  Heading,
  Input,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"
import { sdk } from "../lib/sdk"

type CustomDomainRecord = {
  id: string
  domain: string
  status: string
  dns_error?: string | null
  verified_at?: string | null
}

type DnsInstruction = {
  type: string
  name: string
  value: string
  note?: string
}

type DomainListResponse = {
  custom_domains: CustomDomainRecord[]
  count: number
}

type DomainCreateResponse = {
  custom_domain: CustomDomainRecord
  dns_instructions: DnsInstruction
}

const StoreCustomDomainsWidget = ({ data: _store }: DetailWidgetProps<AdminStore>) => {
  const [domain, setDomain] = useState("")

  const { data, isLoading, refetch } = useQuery<DomainListResponse>({
    queryKey: ["custom-domains"],
    queryFn: () => sdk.client.fetch("/admin/custom-domains"),
  })

  const createDomainMutation = useMutation({
    mutationFn: (value: string) =>
      sdk.client.fetch<DomainCreateResponse>("/admin/custom-domains", {
        method: "POST",
        body: { domain: value },
      }),
    onSuccess: ({ dns_instructions }) => {
      const record = `${dns_instructions.type} ${dns_instructions.name} → ${dns_instructions.value}`
      toast.success(`Domain added. Configure DNS: ${record}`)
      setDomain("")
      refetch()
    },
    onError: (error) => {
      console.error(error)
      toast.error("Failed to add custom domain")
    },
  })

  const verifyDomainMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/custom-domains/${id}/verify`, {
        method: "POST",
      }),
    onSuccess: () => {
      toast.success("Domain verification started")
      refetch()
    },
    onError: (error) => {
      console.error(error)
      toast.error("Failed to verify domain")
    },
  })

  const removeDomainMutation = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/custom-domains/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast.success("Domain removed")
      refetch()
    },
    onError: (error) => {
      console.error(error)
      toast.error("Failed to remove domain")
    },
  })

  const sortedDomains = useMemo(
    () => [...(data?.custom_domains ?? [])].sort((a, b) => a.domain.localeCompare(b.domain)),
    [data?.custom_domains]
  )

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!domain.trim()) {
      toast.error("Enter a domain to continue")
      return
    }

    createDomainMutation.mutate(domain.trim())
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Custom Domains</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Add your store domain and verify DNS configuration before going live.
        </Text>
      </div>

      <form onSubmit={onSubmit} className="flex items-end gap-2 px-6 py-4">
        <div className="flex-1">
          <Text size="small" leading="compact" weight="plus" className="mb-2 block">
            Domain
          </Text>
          <Input
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            placeholder="shop.example.com"
          />
        </div>
        <Button type="submit" isLoading={createDomainMutation.isPending}>
          Add domain
        </Button>
      </form>

      <div className="px-6 py-4">
        {isLoading ? (
          <Text size="small" className="text-ui-fg-subtle">
            Loading domains...
          </Text>
        ) : sortedDomains.length ? (
          <div className="flex flex-col gap-3">
            {sortedDomains.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4">
                <div>
                  <Text weight="plus">{item.domain}</Text>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge size="2xsmall">{item.status}</Badge>
                    {item.dns_error ? (
                      <Text size="small" className="text-ui-fg-subtle">
                        {item.dns_error}
                      </Text>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    onClick={() => verifyDomainMutation.mutate(item.id)}
                    isLoading={verifyDomainMutation.isPending}
                  >
                    Verify
                  </Button>
                  <Button
                    type="button"
                    variant="transparent"
                    size="small"
                    onClick={() => removeDomainMutation.mutate(item.id)}
                    isLoading={removeDomainMutation.isPending}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            No custom domains added yet.
          </Text>
        )}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreCustomDomainsWidget
