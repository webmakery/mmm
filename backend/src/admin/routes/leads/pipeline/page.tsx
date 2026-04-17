import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath, BuildingStorefront, CheckCircleSolid, CurrencyDollar, Funnel, SquaresPlus, XCircleSolid } from "@medusajs/icons"
import { Container, Heading, Select, StatusBadge, Text } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ComponentType, useMemo } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type Lead = {
  id: string
  first_name: string
  last_name?: string
  company?: string
  email?: string
  owner_user_id?: string
  next_follow_up_at?: string
  stage_id?: string
  status?: string
  priority?: "low" | "medium" | "high" | string
}

type LeadStage = {
  id: string
  name: string
  slug: string
  sort_order: number
}

type MetricCard = {
  key: string
  label: string
  value: string | number
  helper: string
  icon: ComponentType<{ className?: string }>
}

const asString = (value: unknown) => {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

const getStatusColor = (status?: string) => {
  switch ((asString(status) || "new").toLowerCase()) {
    case "won":
      return "green"
    case "qualified":
      return "blue"
    case "contacted":
      return "orange"
    case "lost":
      return "red"
    default:
      return "grey"
  }
}

const getPriorityColor = (priority?: Lead["priority"]) => {
  switch ((asString(priority) || "medium").toLowerCase()) {
    case "high":
      return "red"
    case "low":
      return "green"
    default:
      return "orange"
  }
}

const titleize = (value?: string) => {
  const safeValue = asString(value)

  if (!safeValue) {
    return "New"
  }

  return safeValue
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")
}

const PipelineBoardPage = () => {
  const { data: stageData, refetch: refetchStages } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const { data: leadsData, refetch: refetchLeads } = useQuery<{ leads: Lead[]; count?: number }>({
    queryKey: ["pipeline-leads"],
    queryFn: () => sdk.client.fetch("/admin/leads", { query: { limit: 250, offset: 0 } }),
  })

  const moveMutation = useMutation({
    mutationFn: ({ leadId, stageId }: { leadId: string; stageId: string }) =>
      sdk.client.fetch(`/admin/leads/${leadId}/move-stage`, {
        method: "POST",
        body: { stage_id: stageId },
      }),
    onSuccess: () => {
      refetchLeads()
      refetchStages()
    },
  })

  const stages = useMemo(() => [...(stageData?.stages || [])].sort((a, b) => a.sort_order - b.sort_order), [stageData?.stages])
  const leads = leadsData?.leads || []
  const totalLeads = leadsData?.count || leads.length

  const stageBuckets = useMemo(() => {
    return stages.map((stage) => ({
      stage,
      leads: leads.filter((lead) => lead.stage_id === stage.id),
    }))
  }, [stages, leads])

  const stageCountBySlug = useMemo(() => {
    return stageBuckets.reduce<Record<string, number>>((acc, item) => {
      acc[item.stage.slug] = item.leads.length
      return acc
    }, {})
  }, [stageBuckets])

  const wonCount = stageCountBySlug.won || 0
  const lostCount = stageCountBySlug.lost || 0
  const contactedCount = stageCountBySlug.contacted || 0
  const qualifiedCount = stageCountBySlug.qualified || 0

  const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : "0.0"

  const metrics: MetricCard[] = [
    {
      key: "total",
      label: "Total Leads",
      value: totalLeads,
      helper: "Current pipeline volume",
      icon: BuildingStorefront,
    },
    {
      key: "contacted",
      label: "Contacted",
      value: contactedCount,
      helper: "In active outreach",
      icon: ArrowPath,
    },
    {
      key: "qualified",
      label: "Qualified",
      value: qualifiedCount,
      helper: "Sales-ready leads",
      icon: Funnel,
    },
    {
      key: "won",
      label: "Won",
      value: wonCount,
      helper: "Converted opportunities",
      icon: CheckCircleSolid,
    },
    {
      key: "lost",
      label: "Lost",
      value: lostCount,
      helper: "Closed lost",
      icon: XCircleSolid,
    },
    {
      key: "conversion",
      label: "Conversion Rate",
      value: `${conversionRate}%`,
      helper: "Won / total leads",
      icon: CurrencyDollar,
    },
  ]

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Pipeline board</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            Compact pipeline view optimized for high lead volume.
          </Text>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4 xl:grid-cols-6">
          {metrics.map((metric) => {
            const Icon = metric.icon

            return (
              <Container key={metric.key} className="space-y-2 px-3 py-3">
                <div className="flex items-start justify-between gap-2">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {metric.label}
                  </Text>
                  <Icon className="text-ui-fg-subtle" />
                </div>
                <Text size="large" weight="plus" leading="compact">
                  {metric.value}
                </Text>
                <div className="flex items-center justify-between gap-2">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {metric.helper}
                  </Text>
                  <StatusBadge color="grey">
                    {metric.key === "conversion"
                      ? `${conversionRate}%`
                      : `${Math.round(totalLeads > 0 ? (Number(metric.value) / totalLeads) * 100 : 0)}%`}
                  </StatusBadge>
                </div>
              </Container>
            )
          })}
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        {stageBuckets.map(({ stage, leads: stageLeads }) => (
          <Container key={stage.id} className="space-y-2 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <Heading level="h2">{stage.name}</Heading>
              <StatusBadge color="grey">{stageLeads.length}</StatusBadge>
            </div>
            <div className="max-h-[70vh] space-y-2 overflow-y-auto px-2 pb-2">
              {stageLeads.length ? (
                stageLeads.map((lead) => (
                  <Container key={lead.id} className="space-y-2 px-3 py-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link to={`/leads/${lead.id}`} className="text-ui-fg-base truncate">
                          {[asString(lead.first_name), asString(lead.last_name)].filter(Boolean).join(" ") || "Unnamed lead"}
                        </Link>
                        <Text size="xsmall" className="truncate text-ui-fg-subtle">
                          {lead.company || "No company"}
                        </Text>
                      </div>
                      <StatusBadge color={getPriorityColor(lead.priority)}>{titleize(lead.priority || "medium")}</StatusBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge color={getStatusColor(lead.status)}>{titleize(lead.status || stage.slug)}</StatusBadge>
                      {lead.owner_user_id ? <StatusBadge color="purple">Owner</StatusBadge> : <StatusBadge color="grey">Unassigned</StatusBadge>}
                      {lead.next_follow_up_at ? <StatusBadge color="orange">Follow-up</StatusBadge> : <StatusBadge color="grey">No follow-up</StatusBadge>}
                    </div>

                    <div className="grid grid-cols-1 gap-1 text-ui-fg-subtle">
                      <Text size="xsmall" className="truncate">
                        {lead.email || "No email"}
                      </Text>
                      <Text size="xsmall" className="truncate">
                        {lead.next_follow_up_at
                          ? `Follow-up: ${new Date(lead.next_follow_up_at).toLocaleDateString()}`
                          : "Follow-up: Not scheduled"}
                      </Text>
                    </div>

                    <Select
                      value={stage.id}
                      onValueChange={(value) => {
                        if (value !== stage.id) {
                          moveMutation.mutate({ leadId: lead.id, stageId: value })
                        }
                      }}
                    >
                      <Select.Trigger size="small">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content>
                        {stages.map((candidate) => (
                          <Select.Item key={candidate.id} value={candidate.id}>
                            Move to {candidate.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select>
                  </Container>
                ))
              ) : (
                <Text size="small" className="px-3 py-2 text-ui-fg-subtle">
                  No leads in this stage.
                </Text>
              )}
            </div>
          </Container>
        ))}
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Pipeline",
  icon: SquaresPlus,
})

export default PipelineBoardPage
