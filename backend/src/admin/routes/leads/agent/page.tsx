import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Sparkles } from "@medusajs/icons"
import { Button, Container, Heading, Input, StatusBadge, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { sdk } from "../../../lib/sdk"

type AgentLead = {
  id: string
  first_name: string
  company?: string
  source?: string
  source_detail?: string
  category?: string
  lead_score?: number
  lead_score_notes?: string
  follow_up_status?: string
  follow_up_event_id?: string
  outreach_message_draft?: string
}

type DiscoverySummary = {
  discovered: number
  deduped: number
  qualified: number
  inserted_into_crm: number
  skipped_duplicates: number
  disqualified: number
  failed: number
}

type DiscoveryResponse = {
  qualified: Array<{ lead_id: string }>
  disqualified: Array<{ company: string; score: number; reasons: string[] }>
  summary: DiscoverySummary
  count: number
}

const LeadAgentReviewPage = () => {
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [minScore, setMinScore] = useState("65")
  const [maxCrmImports, setMaxCrmImports] = useState("20")
  const [discoverySummary, setDiscoverySummary] = useState<DiscoverySummary | null>(null)

  const { data, refetch, isLoading } = useQuery<{ leads: AgentLead[]; count: number }>({
    queryKey: ["lead-agent-review"],
    queryFn: () => sdk.client.fetch("/admin/leads/agent/review"),
  })

  const discoverMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch<DiscoveryResponse>("/admin/leads/agent/discover", {
        method: "POST",
        body: {
          query,
          location: location || undefined,
          min_score: Number(minScore || 65),
          max_results: 20,
          max_crm_imports: Number(maxCrmImports || 20),
        },
      }),
    onSuccess: (response) => {
      setDiscoverySummary(response.summary)
      refetch()
    },
  })

  const approveMutation = useMutation({
    mutationFn: (leadId: string) =>
      sdk.client.fetch(`/admin/leads/${leadId}/approve-outreach`, {
        method: "POST",
      }),
    onSuccess: () => refetch(),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Lead Agent Review</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Discover leads, review AI qualification, and approve outreach before send.
        </Text>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-5">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search query" />
        <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />
        <Input value={minScore} onChange={(e) => setMinScore(e.target.value)} placeholder="Min score (0-100)" />
        <Input
          value={maxCrmImports}
          onChange={(e) => setMaxCrmImports(e.target.value)}
          placeholder="Max CRM imports"
        />
        <Button
          onClick={() => discoverMutation.mutate()}
          disabled={!query.trim() || discoverMutation.isPending}
          isLoading={discoverMutation.isPending}
        >
          Run Discovery
        </Button>
      </div>

      {discoverySummary ? (
        <div className="px-6 py-4">
          <Container className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3">
            <StatusBadge color="grey">Discovered {discoverySummary.discovered}</StatusBadge>
            <StatusBadge color="grey">Deduped {discoverySummary.deduped}</StatusBadge>
            <StatusBadge color="green">Qualified {discoverySummary.qualified}</StatusBadge>
            <StatusBadge color="blue">Inserted {discoverySummary.inserted_into_crm}</StatusBadge>
            <StatusBadge color="red">Disqualified {discoverySummary.disqualified}</StatusBadge>
            <StatusBadge color="grey">Skipped duplicates {discoverySummary.skipped_duplicates}</StatusBadge>
            <StatusBadge color="red">Failed {discoverySummary.failed}</StatusBadge>
          </Container>
        </div>
      ) : null}

      <div className="px-6 py-4">
        <Container className="divide-y p-0">
          {(data?.leads || []).map((lead) => (
            <div key={lead.id} className="px-3 py-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Text size="small" weight="plus">
                    {lead.company || lead.first_name}
                  </Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {(lead.category || "Unknown category") + " · " + (lead.source || "unknown source")}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge color="blue">Score {lead.lead_score || 0}</StatusBadge>
                  <StatusBadge color="grey">{lead.follow_up_status || "not_scheduled"}</StatusBadge>
                  <Button
                    size="small"
                    variant="secondary"
                    onClick={() => approveMutation.mutate(lead.id)}
                    disabled={approveMutation.isPending || lead.follow_up_status !== "pending_approval"}
                  >
                    Approve & Send
                  </Button>
                </div>
              </div>

              <Text size="xsmall" className="mt-2 text-ui-fg-subtle">
                {lead.lead_score_notes || "No notes"}
              </Text>
              <Text size="small" className="mt-1">
                {lead.outreach_message_draft || "No draft message"}
              </Text>
            </div>
          ))}

          {!isLoading && !(data?.leads || []).length ? (
            <div className="px-3 py-6">
              <Text size="small" className="text-ui-fg-subtle">
                No leads pending review.
              </Text>
            </div>
          ) : null}
        </Container>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Lead Agent",
  icon: Sparkles,
})

export default LeadAgentReviewPage
