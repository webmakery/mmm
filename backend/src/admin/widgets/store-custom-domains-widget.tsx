import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminStore, DetailWidgetProps } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  StatusBadge,
  Text,
  toast,
} from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { FormEvent, useMemo, useState } from "react"
import { sdk } from "../lib/sdk"

type CustomDomainRecord = {
  id: string
  domain: string
  status: "pending_dns" | "active" | "failed" | "removed" | string
  dns_error?: string | null
  failure_reason?: string | null
  expected_value?: string | null
  verification_type?: "a_record" | "cname" | string
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

const getStatusColor = (status: CustomDomainRecord["status"]) => {
  switch (status) {
    case "active":
      return "green"
    case "failed":
      return "red"
    case "removed":
      return "grey"
    default:
      return "orange"
  }
}

const getStatusLabel = (status: CustomDomainRecord["status"]) => {
  switch (status) {
    case "pending_dns":
      return "Pending"
    case "active":
      return "Verified"
    case "failed":
      return "Failed"
    case "removed":
      return "Removed"
    default:
      return status
  }
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

  const dnsReferenceDomain = useMemo(
    () => sortedDomains.find((item) => item.status !== "removed") ?? sortedDomains[0],
    [sortedDomains]
  )

  const dnsType = dnsReferenceDomain?.verification_type === "a_record" ? "A" : "CNAME"
  const dnsValue = dnsReferenceDomain?.expected_value || "Not available"

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

      <div className="grid grid-cols-2 divide-x">
        <div>
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

          <div className="px-6 pb-4">
            {isLoading ? (
              <Text size="small" className="text-ui-fg-subtle">
                Loading domains...
              </Text>
            ) : sortedDomains.length ? (
              <div className="flex flex-col gap-3">
                {sortedDomains.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Text weight="plus" className="truncate">
                        {item.domain}
                      </Text>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge color={getStatusColor(item.status)}>{getStatusLabel(item.status)}</StatusBadge>
                        {item.failure_reason ? (
                          <Text size="small" className="truncate text-ui-fg-subtle">
                            {item.failure_reason}
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
        </div>

        <div className="px-6 py-4">
          <Text size="small" leading="compact" weight="plus" className="mb-2 block">
            DNS setup
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            Connect your custom domain by adding the DNS record below at your domain provider, then run verification.
          </Text>
          <div className="mt-3 space-y-1">
            <Text size="small">
              <span className="text-ui-fg-subtle">Type:</span> {dnsType}
            </Text>
            <Text size="small">
              <span className="text-ui-fg-subtle">Host:</span> @ or subdomain
            </Text>
            <Text size="small">
              <span className="text-ui-fg-subtle">Value:</span> {dnsValue}
            </Text>
          </div>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "store.details.after",
})

export default StoreCustomDomainsWidget
