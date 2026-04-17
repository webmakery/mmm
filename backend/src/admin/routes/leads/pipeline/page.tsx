import { defineRouteConfig } from "@medusajs/admin-sdk"
import { ArrowPath, BuildingStorefront, CheckCircleSolid, CurrencyDollar, Funnel, SquaresPlus, XCircleSolid } from "@medusajs/icons"
import { Button, Container, Heading, Input, Select, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ComponentType, KeyboardEvent, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type Lead = {
  id: string
  first_name: string
  last_name?: string
  company?: string
  role?: string
  email?: string
  phone?: string
  source?: string
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

const getInitials = (firstName?: string, lastName?: string) => {
  const first = asString(firstName).trim()
  const last = asString(lastName).trim()
  return `${first[0] || ""}${last[0] || ""}`.toUpperCase() || "NA"
}

const PipelineBoardPage = () => {
  const navigate = useNavigate()
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)

  const { data: stageData, refetch: refetchStages } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const { data: leadsData, refetch: refetchLeads } = useQuery<{ leads: Lead[]; count?: number }>({
    queryKey: ["pipeline-leads"],
    queryFn: () => sdk.client.fetch("/admin/leads", { query: { limit: 100, offset: 0 } }),
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

  const updateLeadMutation = useMutation({
    mutationFn: (payload: { leadId: string; body: Record<string, unknown> }) =>
      sdk.client.fetch(`/admin/leads/${payload.leadId}`, {
        method: "POST",
        body: payload.body,
      }),
    onSuccess: () => {
      refetchLeads()
    },
    onError: () => {
      toast.error("Failed to update lead")
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

  const getFollowUpState = (dateValue?: string) => {
    if (!dateValue) {
      return { label: "No follow-up", color: "grey" as const }
    }

    const followUpDate = new Date(dateValue)
    if (Number.isNaN(followUpDate.getTime())) {
      return { label: "No follow-up", color: "grey" as const }
    }

    if (followUpDate.getTime() < Date.now()) {
      return {
        label: `Overdue ${followUpDate.toLocaleDateString()}`,
        color: "red" as const,
      }
    }

    return { label: `Follow-up ${followUpDate.toLocaleDateString()}`, color: "orange" as const }
  }

  const onCardKeyDown = (event: KeyboardEvent<HTMLDivElement>, leadId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      navigate(`/leads/${leadId}`)
    }
  }

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
            <div
              className="max-h-[70vh] space-y-2 overflow-y-auto px-2 pb-2"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedLeadId) {
                  moveMutation.mutate({ leadId: draggedLeadId, stageId: stage.id })
                }
                setDraggedLeadId(null)
              }}
            >
              {stageLeads.length ? (
                stageLeads.map((lead) => (
                  <Container
                    key={lead.id}
                    className="group space-y-1.5 px-2 py-2"
                    draggable
                    role="button"
                    tabIndex={0}
                    onDragStart={() => setDraggedLeadId(lead.id)}
                    onKeyDown={(event) => onCardKeyDown(event, lead.id)}
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <Text size="small" weight="plus" className="truncate">
                          {[asString(lead.first_name), asString(lead.last_name)].filter(Boolean).join(" ") || "Unnamed lead"}
                        </Text>
                      </div>
                      <div className="flex items-center gap-1">
                        <StatusBadge color={getStatusColor(lead.status)}>{titleize(lead.status || stage.slug)}</StatusBadge>
                        <span className={lead.priority === "high" ? "h-2 w-2 rounded-full bg-ui-fg-error" : "h-2 w-2 rounded-full bg-ui-fg-muted"} />
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                      <div className="min-w-0">
                        <Text size="xsmall" className="truncate text-ui-fg-subtle">
                          {[lead.company, lead.role].filter(Boolean).join(" • ") || "No company"}
                        </Text>
                        <Text size="xsmall" className="truncate text-ui-fg-subtle">
                          {lead.email || lead.phone || "No contact info"}
                        </Text>
                      </div>

                      <div className="flex items-center gap-1">
                        {[lead.source ? titleize(lead.source) : "Inbound", lead.owner_user_id ? "Assigned" : "Unassigned", lead.priority === "high" ? "Hot" : "Follow-up"]
                          .slice(0, 3)
                          .map((tag) => (
                            <StatusBadge key={`${lead.id}-${tag}`} color="grey">
                              {tag}
                            </StatusBadge>
                          ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ui-bg-subtle">
                          <Text size="xsmall">{getInitials(lead.first_name, lead.last_name)}</Text>
                        </div>
                        <Text size="xsmall" className="truncate text-ui-fg-subtle">
                          {lead.owner_user_id || "Unassigned"}
                        </Text>
                        <StatusBadge color={getFollowUpState(lead.next_follow_up_at).color}>
                          {getFollowUpState(lead.next_follow_up_at).label}
                        </StatusBadge>
                      </div>

                      <div
                        className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {lead.phone ? (
                          <Button size="small" variant="transparent" asChild>
                            <a href={`tel:${lead.phone}`}>Call</a>
                          </Button>
                        ) : null}
                        {lead.email ? (
                          <Button size="small" variant="transparent" asChild>
                            <a href={`mailto:${lead.email}`}>Email</a>
                          </Button>
                        ) : null}
                        <Button size="small" variant="transparent" asChild>
                          <Link to={`/leads/${lead.id}`}>Note</Link>
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-1" onClick={(event) => event.stopPropagation()}>
                      <Input
                        size="small"
                        defaultValue={lead.first_name}
                        onBlur={(event) => {
                          const nextValue = event.target.value.trim()
                          if (nextValue && nextValue !== lead.first_name) {
                            updateLeadMutation.mutate({
                              leadId: lead.id,
                              body: { first_name: nextValue },
                            })
                          }
                        }}
                      />
                      <Input
                        size="small"
                        defaultValue={lead.owner_user_id || ""}
                        placeholder="Owner"
                        onBlur={(event) => {
                          const nextValue = event.target.value.trim()
                          if (nextValue !== (lead.owner_user_id || "")) {
                            updateLeadMutation.mutate({
                              leadId: lead.id,
                              body: { owner_user_id: nextValue || undefined },
                            })
                          }
                        }}
                      />
                      <Select
                        value={lead.status || "new"}
                        onValueChange={(value) => {
                          if (value !== (lead.status || "new")) {
                            updateLeadMutation.mutate({
                              leadId: lead.id,
                              body: { status: value },
                            })
                          }
                        }}
                      >
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          <Select.Item value="new">New</Select.Item>
                          <Select.Item value="contacted">Contacted</Select.Item>
                          <Select.Item value="qualified">Qualified</Select.Item>
                          <Select.Item value="won">Won</Select.Item>
                          <Select.Item value="lost">Lost</Select.Item>
                        </Select.Content>
                      </Select>

                      <Select
                        value={stage.id}
                        onValueChange={(value) => {
                          if (value !== stage.id) {
                            moveMutation.mutate({ leadId: lead.id, stageId: value })
                          }
                        }}
                      >
                        <Select.Trigger>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {stages.map((candidate) => (
                            <Select.Item key={candidate.id} value={candidate.id}>
                              {candidate.name}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </div>
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
