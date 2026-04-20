import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Button, Container, Heading, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../../lib/sdk"

type Campaign = {
  id: string
  name: string
  subject: string
  status: "draft" | "scheduled" | "processing" | "sent" | "failed"
}

const EmailCampaignsPage = () => {
  const { data, refetch, isLoading } = useQuery<{ campaigns: Campaign[]; count: number }>({
    queryKey: ["email-campaigns"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/campaigns", { query: { limit: 100, offset: 0 } }),
  })

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email campaigns</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Draft, schedule, and send email campaigns.
          </Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => refetch()} isLoading={isLoading}>
          Refresh
        </Button>
      </div>

      <Table className="mt-4">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Name</Table.HeaderCell>
            <Table.HeaderCell>Subject</Table.HeaderCell>
            <Table.HeaderCell>Status</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(data?.campaigns || []).map((campaign) => (
            <Table.Row key={campaign.id}>
              <Table.Cell>{campaign.name}</Table.Cell>
              <Table.Cell>{campaign.subject}</Table.Cell>
              <Table.Cell>{campaign.status}</Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Campaigns",
  icon: User,
})

export default EmailCampaignsPage
