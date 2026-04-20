import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Button, Container, Heading, Input, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type Subscriber = {
  id: string
  email: string
  first_name?: string | null
  last_name?: string | null
  status: "active" | "unsubscribed" | "bounced"
}

const EmailSubscribersPage = () => {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<string>("__all")

  const query = useMemo(
    () => ({
      q: search.trim() || undefined,
      status: status === "__all" ? undefined : status,
      limit: 100,
      offset: 0,
    }),
    [search, status]
  )

  const { data, refetch, isLoading } = useQuery<{ subscribers: Subscriber[]; count: number }>({
    queryKey: ["email-subscribers", query],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/subscribers", { query }),
  })

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email subscribers</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Manage newsletter subscribers and statuses.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
          Refresh
        </Button>
      </div>
      <div className="mt-4 flex gap-2">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or name" />
        <Select value={status} onValueChange={setStatus}>
          <Select.Trigger>
            <Select.Value placeholder="Status" />
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__all">All statuses</Select.Item>
            <Select.Item value="active">Active</Select.Item>
            <Select.Item value="unsubscribed">Unsubscribed</Select.Item>
            <Select.Item value="bounced">Bounced</Select.Item>
          </Select.Content>
        </Select>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.subscribers || []).map((subscriber) => (
            <Table.Row key={subscriber.id}>
              <Table.Cell>{subscriber.email}</Table.Cell>
              <Table.Cell>{[subscriber.first_name, subscriber.last_name].filter(Boolean).join(" ") || "—"}</Table.Cell>
              <Table.Cell>{subscriber.status}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscribers",
  icon: User,
})

export default EmailSubscribersPage
