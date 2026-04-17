import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { AdminStore, DetailWidgetProps } from "@medusajs/framework/types"
import {
  Button,
  Container,
  Heading,
  Input,
  Select,
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
  dns_record_type?: "a_record" | "cname" | string
  dns_host?: string | null
  dns_value?: string | null
  target_ip?: string | null
  target_host?: string | null
  verified_at?: string | null
}

type DnsInstruction = {
  type: string
  name: string
  value: string
  note?: string
  ttl?: string
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
      return "Pending DNS"
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
  const [selectedDomainId, setSelectedDomainId] = useState<string>("")

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

  const dnsReferenceDomain = useMemo(() => {
    if (!sortedDomains.length) {
      return undefined
    }

    return (
      sortedDomains.find((item) => item.id === selectedDomainId) ||
      sortedDomains.find((item) => item.status !== "removed") ||
      sortedDomains[0]
    )
  }, [selectedDomainId, sortedDomains])

  const dnsType =
    (dnsReferenceDomain?.dns_record_type || dnsReferenceDomain?.verification_type) === "a_record"
      ? "A"
      : "CNAME"
  const dnsHost = dnsReferenceDomain?.dns_host || "@"
  const dnsValue =
    dnsReferenceDomain?.dns_value ||
    dnsReferenceDomain?.expected_value ||
    dnsReferenceDomain?.target_host ||
    "Not available"
  const dnsTtl = "Auto"

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
                      <Text size="small" className="mt-0.5 truncate text-ui-fg-subtle">
                        {(item.dns_record_type || item.verification_type) === "a_record" ? "A" : "CNAME"}{" "}
                        {item.dns_host || "@"} → {item.dns_value || item.expected_value || item.target_host || "—"}
                      </Text>
                      <div className="mt-2 flex items-center gap-2">
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
                        onClick={() => {
                          setSelectedDomainId(item.id)
                          verifyDomainMutation.mutate(item.id)
                        }}
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
            Each paid store runs on a dedicated instance. Point DNS to your store target below, then verify.
          </Text>

          {sortedDomains.length ? (
            <div className="mt-3">
              <Select value={selectedDomainId || dnsReferenceDomain?.id || ""} onValueChange={setSelectedDomainId}>
                <Select.Trigger>
                  <Select.Value placeholder="Select domain" />
                </Select.Trigger>
                <Select.Content>
                  {sortedDomains.map((item) => (
                    <Select.Item key={item.id} value={item.id}>
                      {item.domain}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>
          ) : null}

          <div className="mt-3 space-y-1">
            <Text size="small">
              <span className="text-ui-fg-subtle">Type:</span> {dnsType}
            </Text>
            <Text size="small">
              <span className="text-ui-fg-subtle">Host:</span> {dnsHost}
            </Text>
            <Text size="small">
              <span className="text-ui-fg-subtle">Value:</span> {dnsValue}
            </Text>
            <Text size="small">
              <span className="text-ui-fg-subtle">TTL:</span> {dnsTtl}
            </Text>
            {dnsType === "A" && dnsReferenceDomain?.target_ip ? (
              <Text size="small">
                <span className="text-ui-fg-subtle">Target IP:</span> {dnsReferenceDomain.target_ip}
              </Text>
            ) : null}
            {dnsReferenceDomain?.target_host ? (
              <Text size="small">
                <span className="text-ui-fg-subtle">Target host:</span> {dnsReferenceDomain.target_host}
              </Text>
            ) : null}
          </div>
          <div className="mt-2 space-y-1">
            <Text size="small" className="text-ui-fg-subtle">
              Use CNAME for subdomains.
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Use A for root domains when your instance ingress IP is available.
            </Text>
            <Text size="small" className="text-ui-fg-subtle">
              Do not point DNS to the shared admin host unless it is your ingress target.
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
