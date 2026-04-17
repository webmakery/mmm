import { defineRouteConfig } from "@medusajs/admin-sdk"
import {
  ArrowPath,
  BuildingStorefront,
  CheckCircleSolid,
  CurrencyDollar,
  Funnel,
  SquaresPlus,
  XCircleSolid,
} from "@medusajs/icons"
import { Badge, Button, Container, Heading, Input, Select, StatusBadge, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { ComponentType, KeyboardEvent, useEffect, useMemo, useState } from "react"
import { sdk } from "../../../lib/sdk"

type LeadActivity = {
  id: string
  type: string
  content: string
  created_at: string
  due_at?: string
}

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
  created_at?: string
  updated_at?: string
  metadata?: {
    tags?: string[]
  }
}

type LeadDetails = Lead & {
  activities: LeadActivity[]
  notes_summary?: string
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

const isSameDay = (dateValue: Date, otherDate: Date) =>
  dateValue.getDate() === otherDate.getDate() && dateValue.getMonth() === otherDate.getMonth() && dateValue.getFullYear() === otherDate.getFullYear()

const PipelineBoardPage = () => {
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null)
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [activityType, setActivityType] = useState("note")
  const [activityContent, setActivityContent] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")

  const { data: stageData, refetch: refetchStages } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const { data: leadsData, refetch: refetchLeads } = useQuery<{ leads: Lead[]; count?: number }>({
    queryKey: ["pipeline-leads"],
    queryFn: () => sdk.client.fetch("/admin/leads", { query: { limit: 100, offset: 0 } }),
  })

  const { data: selectedLeadData, refetch: refetchSelectedLead } = useQuery<{ lead: LeadDetails }>({
    queryKey: ["pipeline-selected-lead", selectedLeadId],
    queryFn: () => sdk.client.fetch(`/admin/leads/${selectedLeadId}`),
    enabled: !!selectedLeadId,
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
      refetchSelectedLead()
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
      refetchSelectedLead()
    },
    onError: () => {
      toast.error("Failed to update lead")
    },
  })

  const addActivityMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/leads/${selectedLeadId}/activities`, {
        method: "POST",
        body: {
          type: activityType,
          content: activityContent,
          due_at: followUpDate ? new Date(followUpDate).toISOString() : undefined,
          set_as_next_follow_up: activityType === "task" && !!followUpDate,
        },
      }),
    onSuccess: () => {
      setActivityContent("")
      setFollowUpDate("")
      toast.success("Activity added")
      refetchLeads()
      refetchSelectedLead()
    },
    onError: () => {
      toast.error("Failed to add activity")
    },
  })

  useEffect(() => {
    if (!selectedLeadId && leadsData?.leads?.length) {
      setSelectedLeadId(leadsData.leads[0].id)
    }
  }, [selectedLeadId, leadsData?.leads])

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

  const selectedLead = selectedLeadData?.lead
  const selectedLeadIndex = leads.findIndex((lead) => lead.id === selectedLeadId)
  const canMovePrev = selectedLeadIndex > 0
  const canMoveNext = selectedLeadIndex !== -1 && selectedLeadIndex < leads.length - 1

  const now = new Date()
  const todayFollowUps = leads.filter((lead) => {
    if (!lead.next_follow_up_at) {
      return false
    }

    const followUpDate = new Date(lead.next_follow_up_at)
    return !Number.isNaN(followUpDate.getTime()) && isSameDay(followUpDate, now)
  })

  const overdueFollowUps = leads.filter((lead) => {
    if (!lead.next_follow_up_at) {
      return false
    }

    const followUpDate = new Date(lead.next_follow_up_at)
    return !Number.isNaN(followUpDate.getTime()) && followUpDate.getTime() < now.getTime() && !isSameDay(followUpDate, now)
  })

  const noActivityThresholdDays = 5
  const noActivityLeads = leads.filter((lead) => {
    const lastActivityTime = new Date(lead.updated_at || lead.created_at || 0).getTime()
    if (!lastActivityTime) {
      return false
    }

    const daysInactive = (now.getTime() - lastActivityTime) / (24 * 60 * 60 * 1000)
    return daysInactive >= noActivityThresholdDays
  })

  const contactedStuck = leads.filter((lead) => {
    if ((lead.status || "").toLowerCase() !== "contacted") {
      return false
    }

    const touchedAt = new Date(lead.updated_at || lead.created_at || 0).getTime()
    if (!touchedAt) {
      return false
    }

    return (now.getTime() - touchedAt) / (24 * 60 * 60 * 1000) > 5
  })

  const wonCount = stageCountBySlug.won || 0
  const lostCount = stageCountBySlug.lost || 0
  const contactedCount = stageCountBySlug.contacted || 0
  const qualifiedCount = stageCountBySlug.qualified || 0
  const conversionRate = totalLeads > 0 ? ((wonCount / totalLeads) * 100).toFixed(1) : "0.0"

  const metricCards: MetricCard[] = [
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
      setSelectedLeadId(leadId)
    }
  }

  const handleSnooze = (days: number) => {
    if (!selectedLeadId) {
      return
    }

    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + days)
    nextDate.setHours(10, 0, 0, 0)

    updateLeadMutation.mutate({
      leadId: selectedLeadId,
      body: { next_follow_up_at: nextDate.toISOString() },
    })
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Pipeline board</Heading>
          <Text size="small" className="mt-1 text-ui-fg-subtle">
            Fast split view for pipeline action and lead decisions.
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
          <Container className="flex items-center justify-between px-3 py-3">
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Follow-up Today
              </Text>
              <Text size="large" weight="plus" leading="compact">
                {todayFollowUps.length}
              </Text>
            </div>
            <StatusBadge color={todayFollowUps.length ? "orange" : "grey"}>{todayFollowUps.length ? "Hot" : "Clear"}</StatusBadge>
          </Container>
          <Container className="flex items-center justify-between px-3 py-3">
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Stuck in Contacted {'>'} 5 days
              </Text>
              <Text size="large" weight="plus" leading="compact">
                {contactedStuck.length}
              </Text>
            </div>
            <StatusBadge color={contactedStuck.length ? "red" : "grey"}>{contactedStuck.length ? "Needs action" : "On track"}</StatusBadge>
          </Container>
          <Container className="flex items-center justify-between px-3 py-3">
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Conversion Rate
              </Text>
              <Text size="large" weight="plus" leading="compact">
                {conversionRate}%
              </Text>
            </div>
            <StatusBadge color="green">Realtime</StatusBadge>
          </Container>
        </div>

        <div className="grid grid-cols-2 gap-3 px-6 py-4 xl:grid-cols-6">
          {metricCards.map((metric) => {
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

      <div className="flex items-start gap-3">
        <div className={`min-w-0 flex-1 transition-all duration-200 ${selectedLeadId ? "xl:w-[62%]" : "w-full"}`}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <StatusBadge color="orange">🔥 Follow-up Today {todayFollowUps.length}</StatusBadge>
            <StatusBadge color="red">⚠️ Overdue {overdueFollowUps.length}</StatusBadge>
            <StatusBadge color="grey">💤 No activity ({noActivityThresholdDays}+ days) {noActivityLeads.length}</StatusBadge>
          </div>

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
                    stageLeads.map((lead) => {
                      const followUpState = getFollowUpState(lead.next_follow_up_at)
                      const overdue = followUpState.color === "red"

                      return (
                        <Container
                          key={lead.id}
                          className={`group space-y-1.5 px-2 py-2 ${selectedLeadId === lead.id ? "ring-1 ring-ui-border-interactive" : ""}`}
                          draggable
                          role="button"
                          tabIndex={0}
                          onDragStart={() => setDraggedLeadId(lead.id)}
                          onKeyDown={(event) => onCardKeyDown(event, lead.id)}
                          onClick={() => setSelectedLeadId(lead.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <Text size="small" weight="plus" className="truncate">
                                {[asString(lead.first_name), asString(lead.last_name)].filter(Boolean).join(" ") || "Unnamed lead"}
                              </Text>
                            </div>
                            <div className="flex items-center gap-1">
                              <StatusBadge color={getStatusColor(lead.status)}>{titleize(lead.status || stage.slug)}</StatusBadge>
                              <span className={lead.priority === "high" || overdue ? "h-2 w-2 rounded-full bg-ui-fg-error" : "h-2 w-2 rounded-full bg-ui-fg-muted"} />
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
                              <StatusBadge color={followUpState.color}>{followUpState.label}</StatusBadge>
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
                              <Button size="small" variant="transparent" onClick={() => setSelectedLeadId(lead.id)}>
                                Open
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
                      )
                    })
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

        <div
          className={`sticky top-0 hidden max-h-[calc(100vh-120px)] overflow-y-auto transition-all duration-200 xl:block ${selectedLeadId ? "w-[38%] opacity-100" : "w-0 opacity-0"}`}
        >
          {selectedLead ? (
            <Container className="divide-y p-0">
              <div className="space-y-3 px-6 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Heading>{[selectedLead.first_name, selectedLead.last_name].filter(Boolean).join(" ") || "Unnamed lead"}</Heading>
                    <Text size="small" className="text-ui-fg-subtle">
                      {selectedLead.company || "No company"}
                    </Text>
                  </div>
                  <Button size="small" variant="secondary" onClick={() => setSelectedLeadId(null)}>
                    Close
                  </Button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge color={getStatusColor(selectedLead.status)}>{titleize(selectedLead.status)}</StatusBadge>
                  <StatusBadge color={selectedLead.priority === "high" ? "red" : "grey"}>{titleize(selectedLead.priority || "medium")}</StatusBadge>
                  {(selectedLead.metadata?.tags || [selectedLead.source ? titleize(selectedLead.source) : "Inbound", selectedLead.owner_user_id ? "Assigned" : "Unassigned"]).map(
                    (tag) => (
                      <Badge key={`${selectedLead.id}-${tag}`}>{tag}</Badge>
                    )
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    defaultValue={selectedLead.first_name}
                    onBlur={(event) => {
                      const nextValue = event.target.value.trim()
                      if (nextValue && nextValue !== selectedLead.first_name) {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          body: { first_name: nextValue },
                        })
                      }
                    }}
                  />
                  <Input
                    defaultValue={selectedLead.last_name || ""}
                    placeholder="Last name"
                    onBlur={(event) => {
                      const nextValue = event.target.value.trim()
                      if (nextValue !== (selectedLead.last_name || "")) {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          body: { last_name: nextValue || undefined },
                        })
                      }
                    }}
                  />
                  <Input
                    defaultValue={selectedLead.email || ""}
                    placeholder="Email"
                    onBlur={(event) => {
                      const nextValue = event.target.value.trim()
                      if (nextValue !== (selectedLead.email || "")) {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          body: { email: nextValue || undefined },
                        })
                      }
                    }}
                  />
                  <Input
                    defaultValue={selectedLead.phone || ""}
                    placeholder="Phone"
                    onBlur={(event) => {
                      const nextValue = event.target.value.trim()
                      if (nextValue !== (selectedLead.phone || "")) {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          body: { phone: nextValue || undefined },
                        })
                      }
                    }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={selectedLead.status || "new"}
                    onValueChange={(value) => updateLeadMutation.mutate({ leadId: selectedLead.id, body: { status: value } })}
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
                    value={selectedLead.stage_id || ""}
                    onValueChange={(value) => {
                      if (value) {
                        moveMutation.mutate({ leadId: selectedLead.id, stageId: value })
                      }
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="Change stage" />
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

                <div className="flex flex-wrap items-center gap-2">
                  {selectedLead.phone ? (
                    <Button size="small" variant="secondary" asChild>
                      <a href={`tel:${selectedLead.phone}`}>Call</a>
                    </Button>
                  ) : null}
                  {selectedLead.email ? (
                    <Button size="small" variant="secondary" asChild>
                      <a href={`mailto:${selectedLead.email}`}>Email</a>
                    </Button>
                  ) : null}
                  <Button size="small" variant="secondary" onClick={() => setActivityType("note")}>
                    Add note
                  </Button>
                  <Button size="small" variant="secondary" onClick={() => handleSnooze(1)}>
                    Snooze tomorrow
                  </Button>
                  <Button size="small" variant="secondary" onClick={() => handleSnooze(7)}>
                    Snooze next week
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button size="small" variant="transparent" disabled={!canMovePrev} onClick={() => canMovePrev && setSelectedLeadId(leads[selectedLeadIndex - 1].id)}>
                    Previous lead
                  </Button>
                  <Button size="small" variant="transparent" disabled={!canMoveNext} onClick={() => canMoveNext && setSelectedLeadId(leads[selectedLeadIndex + 1].id)}>
                    Next lead
                  </Button>
                </div>
              </div>

              <div className="space-y-3 px-6 py-4">
                <div className="flex items-center justify-between">
                  <Heading level="h2">Follow-up</Heading>
                  <StatusBadge color={getFollowUpState(selectedLead.next_follow_up_at).color}>{getFollowUpState(selectedLead.next_follow_up_at).label}</StatusBadge>
                </div>
                <Input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(event) => setFollowUpDate(event.target.value)}
                  placeholder="Set follow-up"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="small"
                    onClick={() => {
                      if (followUpDate) {
                        updateLeadMutation.mutate({
                          leadId: selectedLead.id,
                          body: { next_follow_up_at: new Date(followUpDate).toISOString() },
                        })
                      }
                    }}
                    disabled={!followUpDate}
                  >
                    Save follow-up
                  </Button>
                  <StatusBadge color="orange">
                    Best time: 10–11 AM
                  </StatusBadge>
                  {noActivityLeads.some((lead) => lead.id === selectedLead.id) ? <StatusBadge color="red">Reminder: no action in 5+ days</StatusBadge> : null}
                </div>
              </div>

              <div className="space-y-3 px-6 py-4">
                <Heading level="h2">Add activity</Heading>
                <Select value={activityType} onValueChange={setActivityType}>
                  <Select.Trigger>
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Content>
                    <Select.Item value="note">Note</Select.Item>
                    <Select.Item value="call">Call</Select.Item>
                    <Select.Item value="email">Email</Select.Item>
                    <Select.Item value="meeting">Meeting</Select.Item>
                    <Select.Item value="task">Task</Select.Item>
                  </Select.Content>
                </Select>
                <Textarea value={activityContent} onChange={(event) => setActivityContent(event.target.value)} placeholder="Log note, call outcome, or next action" />
                <Button onClick={() => addActivityMutation.mutate()} disabled={!activityContent || addActivityMutation.isPending}>
                  Save activity
                </Button>
              </div>

              <div className="space-y-2 px-6 py-4">
                <Heading level="h2">Activity timeline</Heading>
                {selectedLead.activities?.length ? (
                  [...selectedLead.activities]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map((activity) => (
                      <Container key={activity.id} className="space-y-1 px-3 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <StatusBadge color="grey">{titleize(activity.type)}</StatusBadge>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {new Date(activity.created_at).toLocaleString()}
                          </Text>
                        </div>
                        <Text size="small">{activity.content}</Text>
                        {activity.due_at ? (
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            Due {new Date(activity.due_at).toLocaleString()}
                          </Text>
                        ) : null}
                      </Container>
                    ))
                ) : (
                  <Text size="small" className="text-ui-fg-subtle">
                    No activity yet.
                  </Text>
                )}
              </div>
            </Container>
          ) : (
            <Container className="px-6 py-4">
              <Text size="small" className="text-ui-fg-subtle">
                Select a lead to open details.
              </Text>
            </Container>
          )}
        </div>
      </div>
    </div>
  )
}

export const config = defineRouteConfig({
  label: "Pipeline",
  icon: SquaresPlus,
})

export default PipelineBoardPage
