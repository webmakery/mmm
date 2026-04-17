import { Badge, Button, Container, Heading, Input, Label, Select, Table, Text, Textarea, toast } from "@medusajs/ui"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { sdk } from "../../../lib/sdk"

type LeadStage = {
  id: string
  name: string
  slug: string
}

type LeadActivity = {
  id: string
  type: string
  content: string
  created_by?: string
  due_at?: string
  completed_at?: string
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
  owner_user_id?: string
  notes_summary?: string
  customer_id?: string
  next_follow_up_at?: string
  stage?: LeadStage
  activities: LeadActivity[]
}

const LeadDetailsPage = () => {
  const { id } = useParams()
  const [stageId, setStageId] = useState("")
  const [status, setStatus] = useState("__keep")
  const [activityType, setActivityType] = useState("note")
  const [activityContent, setActivityContent] = useState("")
  const [followUpDate, setFollowUpDate] = useState("")

  const { data, refetch } = useQuery<{ lead: Lead }>({
    queryKey: ["lead", id],
    queryFn: () => sdk.client.fetch(`/admin/leads/${id}`),
    enabled: !!id,
  })

  const { data: stagesData } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  const sortedActivities = useMemo(() => {
    return [...(data?.lead.activities || [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [data?.lead.activities])

  const moveStageMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/leads/${id}/move-stage`, {
        method: "POST",
        body: {
          stage_id: stageId,
          status: status === "__keep" ? undefined : status,
        },
      }),
    onSuccess: () => {
      toast.success("Lead stage updated")
      refetch()
    },
    onError: () => toast.error("Failed to move stage"),
  })

  const addActivityMutation = useMutation({
    mutationFn: () =>
      sdk.client.fetch(`/admin/leads/${id}/activities`, {
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

  if (!data?.lead) {
    return <Container>Loading...</Container>
  }

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>{[data.lead.first_name, data.lead.last_name].filter(Boolean).join(" ")}</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            {data.lead.email || "No email"}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{data.lead.status}</Badge>
          {data.lead.customer_id && (
            <Link to={`/customers/${data.lead.customer_id}`}>View customer</Link>
          )}
        </div>
      </Container>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_340px]">
        <Container className="divide-y p-0">
          <div className="px-6 py-4">
            <Heading level="h2">Activity timeline</Heading>
          </div>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell>Type</Table.HeaderCell>
                <Table.HeaderCell>Content</Table.HeaderCell>
                <Table.HeaderCell>Due</Table.HeaderCell>
                <Table.HeaderCell>Created</Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {sortedActivities.map((activity) => (
                <Table.Row key={activity.id}>
                  <Table.Cell>{activity.type}</Table.Cell>
                  <Table.Cell>{activity.content}</Table.Cell>
                  <Table.Cell>{activity.due_at ? new Date(activity.due_at).toLocaleString() : "-"}</Table.Cell>
                  <Table.Cell>{new Date(activity.created_at).toLocaleString()}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </Container>

        <div className="flex flex-col gap-y-4">
          <Container className="space-y-3 px-6 py-4">
            <Heading level="h2">Lead info</Heading>
            <Text size="small">Company: {data.lead.company || "-"}</Text>
            <Text size="small">Phone: {data.lead.phone || "-"}</Text>
            <Text size="small">Source: {data.lead.source || "-"}</Text>
            <Text size="small">Owner: {data.lead.owner_user_id || "-"}</Text>
            <Text size="small">Stage: {data.lead.stage?.name || "-"}</Text>
            <Text size="small">Next follow-up: {data.lead.next_follow_up_at ? new Date(data.lead.next_follow_up_at).toLocaleString() : "-"}</Text>
          </Container>

          <Container className="space-y-3 px-6 py-4">
            <Heading level="h2">Move stage</Heading>
            <Select value={stageId} onValueChange={setStageId}>
              <Select.Trigger>
                <Select.Value placeholder="Select stage" />
              </Select.Trigger>
              <Select.Content>
                {stagesData?.stages.map((stage) => (
                  <Select.Item key={stage.id} value={stage.id}>
                    {stage.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <Select.Trigger>
                <Select.Value placeholder="Optional status" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="__keep">Keep status</Select.Item>
                <Select.Item value="new">New</Select.Item>
                <Select.Item value="contacted">Contacted</Select.Item>
                <Select.Item value="qualified">Qualified</Select.Item>
                <Select.Item value="won">Won</Select.Item>
                <Select.Item value="lost">Lost</Select.Item>
              </Select.Content>
            </Select>
            <Button onClick={() => moveStageMutation.mutate()} disabled={!stageId || moveStageMutation.isPending}>
              Update stage
            </Button>
          </Container>

          <Container className="space-y-3 px-6 py-4">
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
            <div>
              <Label>Content</Label>
              <Textarea value={activityContent} onChange={(e) => setActivityContent(e.target.value)} />
            </div>
            <div>
              <Label>Due date (optional)</Label>
              <Input type="datetime-local" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
            </div>
            <Button onClick={() => addActivityMutation.mutate()} disabled={!activityContent || addActivityMutation.isPending}>
              Add activity
            </Button>
          </Container>

          <Container className="space-y-3 px-6 py-4">
            <Heading level="h2">Convert</Heading>
            <Button variant="secondary" onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending}>
              Convert to customer
            </Button>
          </Container>
        </div>
      </div>
    </div>
  )
}

export default LeadDetailsPage
