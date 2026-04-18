import { Container, Heading, Text, Badge } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { DetailWidgetProps, AdminCustomer } from "@medusajs/framework/types"
import { sdk } from "../lib/sdk"
import {
  JourneyDebug,
  computeIntentScore,
  computeJourneyStage,
  eventCount,
  formatDateTime,
  getFlags,
  getNextBestAction,
} from "../lib/customer-journey"

const CustomerJourneyWidget = ({ data: customer }: DetailWidgetProps<AdminCustomer>) => {
  const { data, isLoading, isError } = useQuery<JourneyDebug>({
    queryKey: ["customer-journey-widget", customer.id],
    queryFn: () => sdk.client.fetch(`/admin/journey/customer/${customer.id}`, { method: "GET" }),
    retry: 1,
  })

  const events = data?.recent_events ?? []
  const flags = getFlags(data ?? null)
  const intentScore = computeIntentScore(data ?? null)
  const source = data?.rollup?.latest_source || "-"
  const campaign = data?.rollup?.latest_campaign || "-"

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">Customer journey</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Read-only CRM insights for this customer.
        </Text>
      </div>

      {isLoading ? (
        <div className="px-6 py-4">
          <Text size="small">Loading journey...</Text>
        </div>
      ) : null}

      {isError ? (
        <div className="px-6 py-4">
          <Text size="small">Failed to load customer journey.</Text>
        </div>
      ) : null}

      {!isLoading && !isError && !data ? (
        <div className="px-6 py-4">
          <Text size="small">No journey data available yet.</Text>
        </div>
      ) : null}

      {!isLoading && !isError && data ? (
        <>
          <div className="grid grid-cols-2 gap-3 px-6 py-4">
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Journey stage
              </Text>
              <Text size="small">{computeJourneyStage(data)}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Intent score
              </Text>
              <Text size="small">{intentScore}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Last activity
              </Text>
              <Text size="small">{formatDateTime(data.rollup?.last_event_at)}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Orders / paid orders
              </Text>
              <Text size="small">
                {eventCount(events, "order_placed")} / {eventCount(events, "payment_captured")}
              </Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Source
              </Text>
              <Text size="small">{source}</Text>
            </div>
            <div>
              <Text size="xsmall" className="text-ui-fg-subtle">
                Campaign
              </Text>
              <Text size="small">{campaign}</Text>
            </div>
          </div>

          <div className="px-6 py-4">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Flags
            </Text>
            {!flags.length ? (
              <Text size="small">No active flags.</Text>
            ) : (
              <div className="mt-2 flex flex-wrap gap-2">
                {flags.map((flag) => (
                  <Badge key={flag} color="grey" size="2xsmall">
                    {flag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Recent events
            </Text>
            {!events.length ? (
              <Text size="small">No journey events yet.</Text>
            ) : (
              <div className="mt-2 flex flex-col gap-2">
                {events.slice(0, 8).map((event, index) => (
                  <div key={`${event.event_name || "event"}-${index}`} className="flex items-center justify-between gap-2">
                    <Text size="small">{event.event_name || "activity"}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {formatDateTime(event.occurred_at)}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-4">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Next best action
            </Text>
            <Text size="small">{getNextBestAction(flags)}</Text>
          </div>
        </>
      ) : null}
    </Container>
  )
}

export const config = {
  zone: "customer.details.after",
}

export default CustomerJourneyWidget
