import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User, PlusMini } from "@medusajs/icons"
import { Button, Container, Drawer, Heading, Input, Select, StatusBadge, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import CreateLeadForm from "../../components/leads/create-lead-form"
import { sdk } from "../../lib/sdk"

type Lead = {
  id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  source?: string
  status: string
  owner_user_id?: string
  next_follow_up_at?: string
  stage_id?: string
  stage_name?: string
  updated_at?: string
  created_at?: string
  metadata?: {
    tags?: string[]
  }
}

type LeadStage = {
  id: string
  name: string
}

type InboxFilter = "all" | "needs_action" | "overdue" | "no_activity" | "today"

const asString = (value: unknown) => {
  if (typeof value === "string") {
    return value
  }

  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
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

const isSameDay = (dateValue: Date, otherDate: Date) =>
  dateValue.getDate() === otherDate.getDate() && dateValue.getMonth() === otherDate.getMonth() && dateValue.getFullYear() === otherDate.getFullYear()

const getDaysDiff = (from: Date, to: Date) => Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000))

const getFollowUpState = (dateValue?: string) => {
  if (!dateValue) {
    return {
      color: "grey" as const,
      dotClassName: "bg-ui-fg-muted",
      label: "No follow-up",
      needsAction: false,
      isOverdue: false,
      isToday: false,
    }
  }

  const followUpDate = new Date(dateValue)
  if (Number.isNaN(followUpDate.getTime())) {
    return {
      color: "grey" as const,
      dotClassName: "bg-ui-fg-muted",
      label: "No follow-up",
      needsAction: false,
      isOverdue: false,
      isToday: false,
    }
  }

  const now = new Date()
  const overdue = followUpDate.getTime() < now.getTime() && !isSameDay(followUpDate, now)
  const today = isSameDay(followUpDate, now)
  const tomorrow = isSameDay(followUpDate, new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1))

  if (overdue) {
    const days = Math.max(1, getDaysDiff(followUpDate, now))

    return {
      color: "red" as const,
      dotClassName: "bg-ui-fg-error",
      label: `Overdue (${days} day${days > 1 ? "s" : ""})`,
      needsAction: true,
      isOverdue: true,
      isToday: false,
    }
  }

  if (today) {
    return {
      color: "orange" as const,
      dotClassName: "bg-ui-tag-orange-text",
      label: `Today at ${followUpDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      needsAction: true,
      isOverdue: false,
      isToday: true,
    }
  }

  if (tomorrow) {
    return {
      color: "green" as const,
      dotClassName: "bg-ui-tag-green-text",
      label: "Tomorrow",
      needsAction: false,
      isOverdue: false,
      isToday: false,
    }
  }

  return {
    color: "grey" as const,
    dotClassName: "bg-ui-fg-muted",
    label: followUpDate.toLocaleDateString(),
    needsAction: false,
    isOverdue: false,
    isToday: false,
  }
}

const noActivityThresholdDays = 5

const getInactiveDays = (lead: Lead) => {
  const touchedAt = new Date(lead.updated_at || lead.created_at || 0)
  if (Number.isNaN(touchedAt.getTime())) {
    return 0
  }

  return getDaysDiff(touchedAt, new Date())
}

const getDisplayName = (lead: Lead) => {
  const fullName = [lead.first_name, lead.last_name].filter(Boolean).join(" ").trim()
  return fullName || "Unnamed lead"
}

const LeadsPage = () => {
  const [status, setStatus] = useState("__all")
  const [stageId, setStageId] = useState("__all")
  const [source, setSource] = useState("")
  const [ownerUserId, setOwnerUserId] = useState("")
  const [search, setSearch] = useState("")
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all")
  const [isCreateOpen, setCreateOpen] = useState(false)

  const query = useMemo(
    () => ({
      status: status === "__all" ? undefined : status,
      stage_id: stageId === "__all" ? undefined : stageId,
      source: source.trim() || undefined,
      owner_user_id: ownerUserId.trim() || undefined,
      q: search.trim() || undefined,
      limit: 100,
      offset: 0,
    }),
    [status, stageId, source, ownerUserId, search]
  )

  const { data, refetch, isLoading } = useQuery<{ leads: Lead[]; count: number }>({
    queryKey: ["leads", query],
    queryFn: () => sdk.client.fetch("/admin/leads", { query }),
  })

  const { data: stagesData } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const leads = data?.leads || []

  const insights = useMemo(() => {
    const today = leads.filter((lead) => getFollowUpState(lead.next_follow_up_at).isToday)
    const overdue = leads.filter((lead) => getFollowUpState(lead.next_follow_up_at).isOverdue)
    const inactive = leads.filter((lead) => getInactiveDays(lead) >= noActivityThresholdDays)

    return {
      today,
      overdue,
      inactive,
    }
  }, [leads])

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const followUpState = getFollowUpState(lead.next_follow_up_at)
      const inactive = getInactiveDays(lead) >= noActivityThresholdDays

      switch (inboxFilter) {
        case "needs_action":
          return followUpState.needsAction || inactive
        case "overdue":
          return followUpState.isOverdue
        case "no_activity":
          return inactive
        case "today":
          return followUpState.isToday
        default:
          return true
      }
    })
  }, [leads, inboxFilter])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Leads</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Inbox view for quick follow-up and stage movement.
          </Text>
        </div>
        <Drawer open={isCreateOpen} onOpenChange={setCreateOpen}>
          <Drawer.Trigger asChild>
            <Button>
              <PlusMini />
              Create Lead
            </Button>
          </Drawer.Trigger>
          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Create Lead</Drawer.Title>
            </Drawer.Header>
            <Drawer.Body>
              <CreateLeadForm
                onSuccess={() => {
                  setCreateOpen(false)
                  refetch()
                }}
              />
            </Drawer.Body>
          </Drawer.Content>
        </Drawer>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-5">
        <Input placeholder="Search name, email, company" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <Select.Trigger>
            <Select.Value placeholder="Status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all">All statuses</Select.Item>
            <Select.Item value="new">New</Select.Item>
            <Select.Item value="contacted">Contacted</Select.Item>
            <Select.Item value="qualified">Qualified</Select.Item>
            <Select.Item value="won">Won</Select.Item>
            <Select.Item value="lost">Lost</Select.Item>
          </Select.Content>
        </Select>
        <Select value={stageId} onValueChange={setStageId}>
          <Select.Trigger>
            <Select.Value placeholder="Stage" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all">All stages</Select.Item>
            {stagesData?.stages.map((stage) => (
              <Select.Item key={stage.id} value={stage.id}>
                {stage.name}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
        <Input placeholder="Source" value={source} onChange={(e) => setSource(e.target.value)} />
        <Input placeholder="Owner user ID" value={ownerUserId} onChange={(e) => setOwnerUserId(e.target.value)} />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-6 py-4">
        <Button size="small" variant={inboxFilter === "all" ? "primary" : "secondary"} onClick={() => setInboxFilter("all")}>
          All
        </Button>
        <Button
          size="small"
          variant={inboxFilter === "needs_action" ? "primary" : "secondary"}
          onClick={() => setInboxFilter("needs_action")}
        >
          Needs action
        </Button>
        <Button size="small" variant={inboxFilter === "overdue" ? "primary" : "secondary"} onClick={() => setInboxFilter("overdue")}>
          Overdue
        </Button>
        <Button
          size="small"
          variant={inboxFilter === "no_activity" ? "primary" : "secondary"}
          onClick={() => setInboxFilter("no_activity")}
        >
          No activity
        </Button>
        <Button size="small" variant={inboxFilter === "today" ? "primary" : "secondary"} onClick={() => setInboxFilter("today")}>
          Today
        </Button>
        <Button size="small" variant="transparent" asChild>
          <Link to="/leads/pipeline">Pipeline board</Link>
        </Button>
        <Button size="small" variant="transparent" asChild>
          <Link to="/leads/agent">Lead agent review</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
        <Container className="flex items-center justify-between px-3 py-3" onClick={() => setInboxFilter("today")}>
          <Text size="small">🔥 {insights.today.length} leads need follow-up today</Text>
          <StatusBadge color={insights.today.length ? "orange" : "grey"}>{insights.today.length ? "Today" : "Clear"}</StatusBadge>
        </Container>
        <Container className="flex items-center justify-between px-3 py-3" onClick={() => setInboxFilter("overdue")}>
          <Text size="small">⚠️ {insights.overdue.length} leads overdue</Text>
          <StatusBadge color={insights.overdue.length ? "red" : "grey"}>{insights.overdue.length ? "Urgent" : "Clear"}</StatusBadge>
        </Container>
        <Container className="flex items-center justify-between px-3 py-3" onClick={() => setInboxFilter("no_activity")}>
          <Text size="small">💤 {insights.inactive.length} inactive leads</Text>
          <StatusBadge color={insights.inactive.length ? "grey" : "green"}>{insights.inactive.length ? "Review" : "Healthy"}</StatusBadge>
        </Container>
      </div>

      <div className="px-6 py-4">
        <Container className="divide-y p-0">
          {filteredLeads.map((lead) => {
            const followUp = getFollowUpState(lead.next_follow_up_at)
            const inactiveDays = getInactiveDays(lead)
            const tags = (lead.metadata?.tags || []).slice(0, 2)

            return (
              <div key={lead.id} className="group flex items-center gap-3 px-3 py-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${followUp.dotClassName}`} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Text size="small" weight="plus" className="truncate">
                      {getDisplayName(lead)}
                    </Text>
                    <StatusBadge color={getStatusColor(lead.status)}>{titleize(lead.status)}</StatusBadge>
                    {lead.stage_name ? <StatusBadge color="grey">{lead.stage_name}</StatusBadge> : null}
                  </div>

                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <StatusBadge color={followUp.color}>{followUp.label}</StatusBadge>
                    {inactiveDays >= noActivityThresholdDays ? <StatusBadge color="grey">No activity ({inactiveDays}d)</StatusBadge> : null}
                    {tags.map((tag) => (
                      <StatusBadge key={`${lead.id}-${tag}`} color="grey">
                        {titleize(tag)}
                      </StatusBadge>
                    ))}
                    {lead.owner_user_id ? <Text size="xsmall" className="text-ui-fg-subtle">Owner: {lead.owner_user_id}</Text> : null}
                  </div>
                </div>

                <div className="hidden items-center gap-1 group-hover:flex group-focus-within:flex">
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
                    <Link to={`/leads/${lead.id}`}>Add note</Link>
                  </Button>
                  <Button size="small" variant="transparent" asChild>
                    <Link to={`/leads/${lead.id}`}>Move stage</Link>
                  </Button>
                </div>
              </div>
            )
          })}

          {!filteredLeads.length ? (
            <div className="px-3 py-6">
              <Text size="small" className="text-ui-fg-subtle">
                No leads match this filter.
              </Text>
            </div>
          ) : null}
        </Container>
      </div>

      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {isLoading ? "Loading leads..." : `${filteredLeads.length} / ${data?.count || 0} leads`}
        </Text>
      </div>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Leads",
  icon: User,
})

export default LeadsPage
