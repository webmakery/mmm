import { defineRouteConfig } from "@medusajs/admin-sdk"
import { User } from "@medusajs/icons"
import { Badge, Button, Container, Heading, Select, Table, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type Campaign = {
  id: string
  name: string
  subject: string
  status: "draft" | "scheduled" | "automated" | "processing" | "sent" | "failed"
}

type CampaignLog = {
  id: string
  subscriber_id: string
  status: string
  error?: string | null
  created_at?: string | null
}

type CampaignAnalytics = {
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  open_rate: number
  click_rate: number
}

const percent = (value: number) => `${Math.round(value * 1000) / 10}%`

const EmailAnalyticsPage = () => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("")

  const campaignsQuery = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ["email-campaigns-for-analytics"],
    queryFn: () => sdk.client.fetch("/admin/email-marketing/campaigns", { query: { limit: 100, offset: 0 } }),
  })

  const campaigns = useMemo(() => campaignsQuery.data?.campaigns || [], [campaignsQuery.data?.campaigns])

  const campaignOptions = useMemo(
    () => campaigns.map((campaign) => ({ label: `${campaign.name} (${campaign.status})`, value: campaign.id })),
    [campaigns]
  )

  const effectiveCampaignId = selectedCampaignId || campaigns[0]?.id || ""

  const analyticsQuery = useQuery<{ analytics: CampaignAnalytics; logs: CampaignLog[] }>({
    queryKey: ["email-campaign-analytics", effectiveCampaignId],
    queryFn: () => sdk.client.fetch(`/admin/email-marketing/campaigns/${effectiveCampaignId}/analytics`),
    enabled: !!effectiveCampaignId,
  })

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading>Email analytics</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-2">
            Monitor recipients, sent, delivered, failed, open rate, and click rate for each campaign.
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" variant="secondary" onClick={() => campaignsQuery.refetch()} isLoading={campaignsQuery.isLoading}>
            Refresh campaigns
          </Button>
          <Button
            size="small"
            variant="secondary"
            onClick={() => analyticsQuery.refetch()}
            isLoading={analyticsQuery.isLoading}
            disabled={!effectiveCampaignId}
          >
            Refresh analytics
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2">
        <Text size="small" className="text-ui-fg-subtle">
          Campaign
        </Text>
        <Select
          value={effectiveCampaignId}
          onValueChange={setSelectedCampaignId}
          disabled={!campaignOptions.length || campaignsQuery.isLoading}
        >
          <Select.Trigger>
            <Select.Value placeholder={campaignOptions.length ? "Select campaign" : "No campaigns available"} />
          </Select.Trigger>
          <Select.Content>
            {campaignOptions.map((campaign) => (
              <Select.Item key={campaign.value} value={campaign.value}>
                {campaign.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </div>

      {analyticsQuery.data?.analytics ? (
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Recipients
            </Text>
            <Heading level="h2">{analyticsQuery.data.analytics.total_recipients}</Heading>
          </Container>
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Sent / Delivered / Failed
            </Text>
            <Heading level="h2">
              {analyticsQuery.data.analytics.sent_count} / {analyticsQuery.data.analytics.delivered_count} / {analyticsQuery.data.analytics.failed_count}
            </Heading>
          </Container>
          <Container>
            <Text size="small" className="text-ui-fg-subtle">
              Open rate / Click rate
            </Text>
            <Heading level="h2">
              {percent(analyticsQuery.data.analytics.open_rate)} / {percent(analyticsQuery.data.analytics.click_rate)}
            </Heading>
          </Container>
        </div>
      ) : null}

      {effectiveCampaignId ? (
        <Table className="mt-4">
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Subscriber</Table.HeaderCell>
              <Table.HeaderCell>Status</Table.HeaderCell>
              <Table.HeaderCell>Error</Table.HeaderCell>
              <Table.HeaderCell>Created</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {(analyticsQuery.data?.logs || []).map((log) => (
              <Table.Row key={log.id}>
                <Table.Cell>{log.subscriber_id}</Table.Cell>
                <Table.Cell>
                  <Badge color={log.status === "failed" ? "red" : "green"}>{log.status}</Badge>
                </Table.Cell>
                <Table.Cell>{log.error || "-"}</Table.Cell>
                <Table.Cell>{log.created_at ? new Date(log.created_at).toLocaleString() : "-"}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      ) : (
        <Text size="small" className="mt-4 text-ui-fg-subtle">
          No campaigns found yet. Create a campaign in Email Campaigns to view analytics.
        </Text>
      )}
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Email Analytics",
  icon: User,
})

export default EmailAnalyticsPage
