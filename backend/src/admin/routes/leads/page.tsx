import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User, PlusMini } from "@medusajs/icons"
import { Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { Link } from "react-router-dom"
import { sdk } from "../../lib/sdk"

type Lead = {
  id: string
  first_name: string
  last_name?: string
  email?: string
  company?: string
  source?: string
  status: string
  owner_user_id?: string
  next_follow_up_at?: string
  stage_name?: string
}

type LeadStage = {
  id: string
  name: string
}

const LeadsPage = () => {
  const [status, setStatus] = useState("__all")
  const [stageId, setStageId] = useState("__all")
  const [source, setSource] = useState("")
  const [ownerUserId, setOwnerUserId] = useState("")
  const [search, setSearch] = useState("")

  const query = {
    status: status === "__all" ? undefined : status,
    stage_id: stageId === "__all" ? undefined : stageId,
    source: source || undefined,
    owner_user_id: ownerUserId || undefined,
    q: search || undefined,
    limit: 50,
    offset: 0,
  }

  const { data, refetch, isLoading } = useQuery<{ leads: Lead[]; count: number }>({
    queryKey: ["leads", query],
    queryFn: () => sdk.client.fetch("/admin/leads", { query }),
  })

  const { data: stagesData } = useQuery<{ stages: LeadStage[] }>({
    queryKey: ["lead-stages"],
    queryFn: () => sdk.client.fetch("/admin/lead-stages"),
  })

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Leads</Heading>
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
      <div className="flex items-center gap-2 px-6 pb-4">
        <Button variant="secondary" onClick={() => refetch()}>
          Apply filters
        </Button>
        <Button asChild>
          <Link to="/leads/pipeline">
            <PlusMini />
            Pipeline board
          </Link>
        </Button>
      </div>
      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Lead</Table.HeaderCell>
            <Table.HeaderCell>Company</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
            <Table.HeaderCell>Stage</Table.HeaderCell>
            <Table.HeaderCell>Source</Table.HeaderCell>
            <Table.HeaderCell>Owner</Table.HeaderCell>
            <Table.HeaderCell>Next follow-up</Table.HeaderCell>
            <Table.HeaderCell>Open</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {data?.leads.map((lead) => (
            <Table.Row key={lead.id}>
              <Table.Cell>{[lead.first_name, lead.last_name].filter(Boolean).join(" ")}</Table.Cell>
              <Table.Cell>{lead.company || "-"}</Table.Cell>
              <Table.Cell>{lead.status}</Table.Cell>
              <Table.Cell>{lead.stage_name || "-"}</Table.Cell>
              <Table.Cell>{lead.source || "-"}</Table.Cell>
              <Table.Cell>{lead.owner_user_id || "-"}</Table.Cell>
              <Table.Cell>{lead.next_follow_up_at ? new Date(lead.next_follow_up_at).toLocaleString() : "-"}</Table.Cell>
              <Table.Cell>
                <Link to={`/leads/${lead.id}`}>Open</Link>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {isLoading ? "Loading leads..." : `${data?.count || 0} leads`}
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
