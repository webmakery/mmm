import { Badge, Button, Container, Heading, Input, Select, StatusBadge, Text, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { KeyboardEvent as ReactKeyboardEvent, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type LeadActivity = {
  id: string
  type: string
  content: string
  due_at?: string
  created_at: string
}

type Lead = {
  id: string
  first_name: string
  last_name?: string
  email?: string
  phone?: string
  company?: string
  source?: string
  status: string
  priority?: "low" | "medium" | "high" | string
  owner_user_id?: string
  customer_id?: string
  next_follow_up_at?: string
  activities: LeadActivity[]
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

const getRelativeTimeLabel = (value?: string) => {
  if (!value) {
    return "just now"
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "just now"
  }

  const diffMs = Date.now() - date.getTime()
  if (diffMs < 60 * 1000) {
    return "just now"
  }

  const diffHours = Math.floor(diffMs / (60 * 60 * 1000))
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 1) {
    return "yesterday"
  }

  return `${diffDays} days ago`
}

const getFollowUpState = (nextFollowUpAt?: string) => {
  if (!nextFollowUpAt) {
    return { color: "grey" as const, label: "No follow-up scheduled" }
  }

  const dueDate = new Date(nextFollowUpAt)
  if (Number.isNaN(dueDate.getTime())) {
    return { color: "grey" as const, label: "No follow-up scheduled" }
  }

  const now = new Date()
  if (dueDate.getTime() < now.getTime()) {
    const diffDays = Math.max(1, Math.ceil((now.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000)))
    return { color: "red" as const, label: `Overdue follow-up (${diffDays} day${diffDays > 1 ? "s" : ""})` }
  }

  return { color: "green" as const, label: `Follow-up due ${getRelativeTimeLabel(nextFollowUpAt)}` }
}

const getActivitySummary = (activityType: string) => {
  switch (asString(activityType).toLowerCase()) {
    case "call":
      return "Called"
    case "email":
      return "Email sent"
    case "note":
      return "Note added"
    case "meeting":
      return "Meeting logged"
    case "task":
      return "Task logged"
    default:
      return titleize(activityType)
  }
}

const LeadDetailsPage = () => {
  const { id } = useParams()
  const [activityContent, setActivityContent] = useState("")

  const { data, refetch } = useQuery<{ lead: Lead }>({
    queryKey: ["lead", id],
    queryFn: () => sdk.client.fetch(`/admin/leads/${id}`),
    enabled: !!id,
  })

  const updateLeadMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      sdk.client.fetch(`/admin/leads/${id}`, {
        method: "POST",
        body,
      }),
    onSuccess: () => {
      refetch()
    },
    onError: () => toast.error("Failed to update lead"),
  })

  const addActivityMutation = useMutation({
    mutationFn: (payload: { type: string; content: string }) =>
      sdk.client.fetch(`/admin/leads/${id}/activities`, {
        method: "POST",
        body: {
          type: payload.type,
          content: payload.content,
        },
      }),
    onSuccess: () => {
      setActivityContent("")
      refetch()
    },
    onError: () => toast.error("Failed to add activity"),
  })

  const convertMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/leads/${id}/convert`, {
        method: "POST",
        body: {},
      }),
    onSuccess: () => {
      toast.success("Lead converted to customer")
      refetch()
    },
    onError: () => toast.error("Failed to convert lead"),
  })

  const sortedActivities = useMemo(() => {
    return [...(data?.lead.activities || [])].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [data?.lead.activities])

  if (!data?.lead) {
    return <Container>Loading...</Container>
  }

  const leadName = [data.lead.first_name, data.lead.last_name].filter(Boolean).join(" ")
  const followUpState = getFollowUpState(data.lead.next_follow_up_at)

  const saveActivity = (type: "note" | "call" | "email") => {
    const content = activityContent.trim()
    if (!content) {
      return
    }

    addActivityMutation.mutate({ type, content })
  }

  const onActivityKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      saveActivity("note")
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="space-y-4 px-6 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-2">
            <Input
              defaultValue={leadName}
              onBlur={(event) => {
                const nextValue = event.target.value.trim()
                if (!nextValue || nextValue === leadName) {
                  return
                }

                const [firstName, ...lastNameParts] = nextValue.split(" ")
                updateLeadMutation.mutate({
                  first_name: firstName,
                  last_name: lastNameParts.join(" ") || undefined,
                })
              }}
            />
            <Input
              defaultValue={data.lead.email || ""}
              placeholder="Email"
              onBlur={(event) => {
                const nextValue = event.target.value.trim()
                if (nextValue !== (data.lead.email || "")) {
                  updateLeadMutation.mutate({ email: nextValue || undefined })
                }
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge color={data.lead.priority === "high" ? "red" : data.lead.priority === "low" ? "grey" : "orange"}>
                {data.lead.priority === "high" ? "🔥 High" : data.lead.priority === "low" ? "Low" : "Medium"}
              </StatusBadge>
              <Select
                value={data.lead.priority || "medium"}
                onValueChange={(value) => updateLeadMutation.mutate({ priority: value })}
              >
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="high">High</Select.Item>
                  <Select.Item value="medium">Medium</Select.Item>
                  <Select.Item value="low">Low</Select.Item>
                </Select.Content>
              </Select>
              {data.lead.customer_id ? <Link to={`/customers/${data.lead.customer_id}`}>View customer</Link> : null}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {(["new", "contacted", "qualified", "won"] as const).map((stage) => (
              <Button
                key={stage}
                size="small"
                variant={data.lead.status === stage ? "primary" : "secondary"}
                onClick={() => updateLeadMutation.mutate({ status: stage })}
              >
                {titleize(stage)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Heading level="h2">Quick add activity</Heading>
          <Input
            value={activityContent}
            onChange={(event) => setActivityContent(event.target.value)}
            placeholder="Write a note, log a call..."
            onBlur={() => saveActivity("note")}
            onKeyDown={onActivityKeyDown}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="small" variant="secondary" onClick={() => saveActivity("call")}>
              Call
            </Button>
            <Button size="small" variant="secondary" onClick={() => saveActivity("email")}>
              Email
            </Button>
            <Button size="small" variant="secondary" onClick={() => saveActivity("note")}>
              Note
            </Button>
          </div>
        </div>
      </Container>

      <Container className="space-y-3 px-6 py-4">
        <div className="flex items-center justify-between gap-2">
          <Heading level="h2">Next best action</Heading>
          <StatusBadge color={followUpState.color}>{followUpState.color === "red" ? "Needs action" : "On track"}</StatusBadge>
        </div>
        <Text size="small" weight="plus">
          {followUpState.color === "red"
            ? `⚠️ ${followUpState.label}`
            : data.lead.priority === "high"
              ? "🔥 High chance to convert"
              : "💡 Keep momentum with a quick follow-up"}
        </Text>
        <div className="flex flex-wrap items-center gap-2">
          {data.lead.phone ? (
            <Button size="small" variant="secondary" asChild>
              <a href={`tel:${data.lead.phone}`}>Call now</a>
            </Button>
          ) : null}
          <Button
            size="small"
            variant="secondary"
            onClick={() => {
              const snoozeDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
              updateLeadMutation.mutate({ next_follow_up_at: snoozeDate.toISOString() })
            }}
          >
            Snooze
          </Button>
          <Button size="small" variant="secondary" onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
            Convert
          </Button>
        </div>
      </Container>

      <Container className="space-y-3 px-6 py-4">
        <Heading level="h2">Activity timeline</Heading>
        {sortedActivities.length ? (
          sortedActivities.map((activity) => (
            <Container key={activity.id} className="space-y-1 px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <Text size="small" weight="plus">
                  {getActivitySummary(activity.type)} — {getRelativeTimeLabel(activity.created_at)}
                </Text>
                <Badge size="2xsmall">{titleize(activity.type)}</Badge>
              </div>
              {activity.content ? <Text size="small">{activity.content}</Text> : null}
            </Container>
          ))
        ) : (
          <Text size="small" className="text-ui-fg-subtle">
            No activity yet.
          </Text>
        )}
      </Container>
    </div>
  )
}

export default LeadDetailsPage
