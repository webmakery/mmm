import { PencilSquare, ArrowPath } from "@medusajs/icons"
import {
  Badge,
  Button,
  Container,
  DataTable,
  DataTablePaginationState,
  Drawer,
  Heading,
  Input,
  Select,
  Text,
  createDataTableColumnHelper,
  useDataTable,
} from "@medusajs/ui"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueries, useQuery } from "@tanstack/react-query"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "../../lib/sdk"

type JourneyRollup = {
  first_seen_at?: string | null
  signup_started_at?: string | null
  signup_completed_at?: string | null
  first_order_at?: string | null
  first_payment_captured_at?: string | null
  last_event_at?: string | null
  last_event_name?: string | null
  latest_source?: string | null
  latest_campaign?: string | null
}

type JourneyEvent = {
  event_name?: string | null
  occurred_at?: string | null
}

type JourneyDebug = {
  customer_id: string
  rollup?: JourneyRollup | null
  recent_events?: JourneyEvent[]
}

type CustomerWithJourney = {
  customer: HttpTypes.AdminCustomer
  journey: JourneyDebug | null
}

type JourneyFilter =
  | "all"
  | "high_intent"
  | "abandoned_checkout"
  | "signed_up_not_purchased"
  | "first_time_buyer"
  | "repeat_customer"

const PAGE_SIZE = 20

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "-"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "-"
  }

  return date.toLocaleString()
}

const daysSince = (value?: string | null) => {
  if (!value) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
}

const eventCount = (events: JourneyEvent[] | undefined, eventName: string) =>
  events?.filter((event) => event.event_name === eventName).length ?? 0

const computeIntentScore = (journey: JourneyDebug | null) => {
  const events = journey?.recent_events ?? []

  let score = 0
  score += eventCount(events, "product_viewed") * 10
  score += eventCount(events, "checkout_started") * 25
  score += eventCount(events, "order_placed") * 30
  score += eventCount(events, "payment_captured") * 35

  return Math.min(100, score)
}

const computeJourneyStage = (journey: JourneyDebug | null) => {
  const rollup = journey?.rollup
  const ordersCount = eventCount(journey?.recent_events, "order_placed")

  if (ordersCount > 1 || (rollup?.first_payment_captured_at && ordersCount > 1)) {
    return "Repeat customer"
  }

  if (rollup?.first_payment_captured_at || rollup?.first_order_at) {
    return "Buyer"
  }

  if (rollup?.signup_completed_at) {
    return "Signed up"
  }

  if (rollup?.signup_started_at) {
    return "Signup started"
  }

  if (rollup?.first_seen_at) {
    return "Aware"
  }

  return "Unknown"
}

const getFlags = (journey: JourneyDebug | null) => {
  const events = journey?.recent_events ?? []
  const intentScore = computeIntentScore(journey)
  const ordersCount = eventCount(events, "order_placed")
  const paidOrdersCount = eventCount(events, "payment_captured")
  const hasCheckoutStarted = eventCount(events, "checkout_started") > 0

  const flags: string[] = []

  if (hasCheckoutStarted && ordersCount === 0) {
    flags.push("Abandoned checkout")
  }

  if (intentScore >= 70) {
    flags.push("High intent")
  }

  if (journey?.rollup?.signup_completed_at && !journey?.rollup?.first_order_at) {
    flags.push("Signed up, no purchase")
  }

  if (paidOrdersCount === 1) {
    flags.push("First-time buyer")
  }

  if (paidOrdersCount > 1) {
    flags.push("Repeat customer")
  }

  return flags
}

const matchesJourneyFilter = (journey: JourneyDebug | null, filter: JourneyFilter) => {
  const flags = getFlags(journey)

  switch (filter) {
    case "high_intent":
      return flags.includes("High intent")
    case "abandoned_checkout":
      return flags.includes("Abandoned checkout")
    case "signed_up_not_purchased":
      return flags.includes("Signed up, no purchase")
    case "first_time_buyer":
      return flags.includes("First-time buyer")
    case "repeat_customer":
      return flags.includes("Repeat customer")
    default:
      return true
  }
}

const withinActivityWindow = (journey: JourneyDebug | null, activityWindow: string) => {
  if (activityWindow === "all") {
    return true
  }

  const age = daysSince(journey?.rollup?.last_event_at)

  if (age === null) {
    return false
  }

  if (activityWindow === "7d") {
    return age <= 7
  }

  if (activityWindow === "30d") {
    return age <= 30
  }

  return true
}

const columnHelper = createDataTableColumnHelper<CustomerWithJourney>()

const CustomersPage = () => {
  const navigate = useNavigate()
  const [pagination, setPagination] = useState<DataTablePaginationState>({
    pageSize: PAGE_SIZE,
    pageIndex: 0,
  })
  const [search, setSearch] = useState("")
  const [appliedSearch, setAppliedSearch] = useState("")
  const [journeyFilter, setJourneyFilter] = useState<JourneyFilter>("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [activityWindow, setActivityWindow] = useState("all")
  const [panelCustomer, setPanelCustomer] = useState<HttpTypes.AdminCustomer | null>(null)

  const offset = pagination.pageIndex * pagination.pageSize

  const { data, isLoading, isError, error } = useQuery<{
    customers: HttpTypes.AdminCustomer[]
    count: number
  }>({
    queryKey: ["customers", pagination.pageSize, offset, appliedSearch],
    queryFn: () =>
      sdk.client.fetch("/admin/customers", {
        query: {
          limit: pagination.pageSize,
          offset,
          q: appliedSearch || undefined,
          order: "-created_at",
        },
      }),
  })

  const journeyQueries = useQueries({
    queries: (data?.customers ?? []).map((customer) => ({
      queryKey: ["customer-journey", customer.id],
      queryFn: () =>
        sdk.client.fetch<JourneyDebug>(`/admin/journey/customer/${customer.id}`, {
          method: "GET",
        }),
      retry: 1,
    })),
  })

  const journeyMap = useMemo(() => {
    const entries = (data?.customers ?? []).map((customer, index) => [customer.id, journeyQueries[index]?.data ?? null] as const)

    return new Map(entries)
  }, [data?.customers, journeyQueries])

  const sourceOptions = useMemo(() => {
    const allSources = Array.from(journeyMap.values())
      .map((journey) => {
        const source = journey?.rollup?.latest_source
        const campaign = journey?.rollup?.latest_campaign

        if (!source && !campaign) {
          return null
        }

        return campaign ? `${source || "Unknown"} / ${campaign}` : (source ?? "Unknown")
      })
      .filter(Boolean) as string[]

    return Array.from(new Set(allSources))
  }, [journeyMap])

  const filteredRows = useMemo(() => {
    const rows = (data?.customers ?? []).map((customer) => ({
      customer,
      journey: journeyMap.get(customer.id) ?? null,
    }))

    return rows.filter((row) => {
      if (!matchesJourneyFilter(row.journey, journeyFilter)) {
        return false
      }

      if (!withinActivityWindow(row.journey, activityWindow)) {
        return false
      }

      if (sourceFilter !== "all") {
        const source = row.journey?.rollup?.latest_source
        const campaign = row.journey?.rollup?.latest_campaign
        const attributionLabel = campaign ? `${source || "Unknown"} / ${campaign}` : (source ?? "Unknown")

        if (attributionLabel !== sourceFilter) {
          return false
        }
      }

      return true
    })
  }, [data?.customers, journeyMap, journeyFilter, sourceFilter, activityWindow])

  const columns = useMemo(
    () => [
      columnHelper.accessor("customer.email", {
        header: "Customer",
        cell: ({ row }) => (
          <button className="text-left" type="button" onClick={() => navigate(`/customers/${row.original.customer.id}`)}>
            <Text weight="plus">{row.original.customer.email || "-"}</Text>
            <Text size="xsmall" className="text-ui-fg-subtle">
              {row.original.customer.first_name || ""} {row.original.customer.last_name || ""}
            </Text>
          </button>
        ),
      }),
      columnHelper.display({
        id: "journey_stage",
        header: "Journey stage",
        cell: ({ row }) => computeJourneyStage(row.original.journey),
      }),
      columnHelper.display({
        id: "intent_score",
        header: "Intent score",
        cell: ({ row }) => `${computeIntentScore(row.original.journey)}`,
      }),
      columnHelper.display({
        id: "last_activity",
        header: "Last activity",
        cell: ({ row }) => formatDateTime(row.original.journey?.rollup?.last_event_at),
      }),
      columnHelper.display({
        id: "orders_count",
        header: "Orders count",
        cell: ({ row }) => `${eventCount(row.original.journey?.recent_events, "order_placed")}`,
      }),
      columnHelper.display({
        id: "paid_orders_count",
        header: "Paid orders",
        cell: ({ row }) => `${eventCount(row.original.journey?.recent_events, "payment_captured")}`,
      }),
      columnHelper.display({
        id: "source",
        header: "Source / attribution",
        cell: ({ row }) => {
          const source = row.original.journey?.rollup?.latest_source
          const campaign = row.original.journey?.rollup?.latest_campaign

          if (!source && !campaign) {
            return "-"
          }

          return campaign ? `${source || "Unknown"} / ${campaign}` : source
        },
      }),
      columnHelper.display({
        id: "flags",
        header: "Flags",
        cell: ({ row }) => {
          const flags = getFlags(row.original.journey)

          if (!flags.length) {
            return <Text size="xsmall">-</Text>
          }

          return (
            <div className="flex flex-wrap gap-1">
              {flags.slice(0, 3).map((flag) => (
                <Badge key={flag} size="2xsmall" color="grey">
                  {flag}
                </Badge>
              ))}
            </div>
          )
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            <Button size="small" variant="transparent" onClick={() => setPanelCustomer(row.original.customer)}>
              View journey
            </Button>
            <Button size="small" variant="transparent" onClick={() => navigate(`/customers/${row.original.customer.id}/edit`)}>
              <PencilSquare />
            </Button>
          </div>
        ),
      }),
    ],
    [navigate]
  )

  const table = useDataTable({
    columns,
    data: filteredRows,
    getRowId: (row) => row.customer.id,
    rowCount: filteredRows.length,
    isLoading,
    pagination: {
      state: pagination,
      onPaginationChange: setPagination,
    },
  })

  const resetFilters = () => {
    setJourneyFilter("all")
    setSourceFilter("all")
    setActivityWindow("all")
  }

  if (isError) {
    throw error
  }

  return (
    <>
      <Container className="divide-y p-0">
        <DataTable instance={table}>
          <DataTable.Toolbar className="flex flex-col gap-3 px-6 py-4">
            <div className="flex w-full items-center justify-between">
              <Heading>Customers</Heading>
              <div className="flex items-center gap-2">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search customers"
                  size="small"
                />
                <Button size="small" variant="secondary" onClick={() => setAppliedSearch(search.trim())}>
                  Search
                </Button>
              </div>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2">
              <Select value={journeyFilter} onValueChange={(value) => setJourneyFilter(value as JourneyFilter)}>
                <Select.Trigger className="min-w-[220px]">
                  <Select.Value placeholder="Journey filter" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All journey signals</Select.Item>
                  <Select.Item value="high_intent">High intent</Select.Item>
                  <Select.Item value="abandoned_checkout">Abandoned checkout</Select.Item>
                  <Select.Item value="signed_up_not_purchased">Signed up but not purchased</Select.Item>
                  <Select.Item value="first_time_buyer">First-time buyer</Select.Item>
                  <Select.Item value="repeat_customer">Repeat customer</Select.Item>
                </Select.Content>
              </Select>

              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <Select.Trigger className="min-w-[220px]">
                  <Select.Value placeholder="Source / campaign" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">All sources / campaigns</Select.Item>
                  {sourceOptions.map((source) => (
                    <Select.Item key={source} value={source}>
                      {source}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>

              <Select value={activityWindow} onValueChange={setActivityWindow}>
                <Select.Trigger className="min-w-[220px]">
                  <Select.Value placeholder="Last activity" />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="all">Any activity window</Select.Item>
                  <Select.Item value="7d">Last active in 7 days</Select.Item>
                  <Select.Item value="30d">Last active in 30 days</Select.Item>
                </Select.Content>
              </Select>

              <Button size="small" variant="secondary" onClick={resetFilters}>
                <ArrowPath />
                Reset
              </Button>
            </div>
          </DataTable.Toolbar>
          <DataTable.Table />
          <DataTable.Pagination />
        </DataTable>
      </Container>

      <JourneyDrawer customer={panelCustomer} onOpenChange={(open) => !open && setPanelCustomer(null)} />
    </>
  )
}

const JourneyDrawer = ({
  customer,
  onOpenChange,
}: {
  customer: HttpTypes.AdminCustomer | null
  onOpenChange: (open: boolean) => void
}) => {
  const { data, isLoading, isError } = useQuery<JourneyDebug>({
    queryKey: ["journey-panel", customer?.id],
    queryFn: () => sdk.client.fetch(`/admin/journey/customer/${customer?.id}`),
    enabled: Boolean(customer?.id),
  })

  const events = data?.recent_events ?? []
  const flags = getFlags(data ?? null)
  const intentScore = computeIntentScore(data ?? null)

  return (
    <Drawer open={Boolean(customer)} onOpenChange={onOpenChange}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Customer journey</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body>
          {!customer ? null : (
            <div className="flex flex-col gap-4">
              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h3">Snapshot</Heading>
                  <Text size="small" className="text-ui-fg-subtle">
                    {customer.email || "Unknown customer"}
                  </Text>
                </div>
                <div className="grid grid-cols-2 gap-3 px-6 py-4">
                  <div>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Journey stage
                    </Text>
                    <Text>{computeJourneyStage(data ?? null)}</Text>
                  </div>
                  <div>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Intent score
                    </Text>
                    <Text>{intentScore}</Text>
                  </div>
                  <div>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Last activity
                    </Text>
                    <Text>{formatDateTime(data?.rollup?.last_event_at)}</Text>
                  </div>
                  <div>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      Orders / paid orders
                    </Text>
                    <Text>
                      {eventCount(events, "order_placed")} / {eventCount(events, "payment_captured")}
                    </Text>
                  </div>
                </div>
              </Container>

              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h3">Attribution</Heading>
                </div>
                <div className="px-6 py-4">
                  <Text size="small">Source: {data?.rollup?.latest_source || "-"}</Text>
                  <Text size="small">Campaign: {data?.rollup?.latest_campaign || "-"}</Text>
                </div>
              </Container>

              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h3">Recent milestones</Heading>
                </div>
                <div className="px-6 py-4">
                  {isLoading ? <Text size="small">Loading journey...</Text> : null}
                  {isError ? <Text size="small">Failed to load journey.</Text> : null}
                  {!isLoading && !isError && !events.length ? <Text size="small">No journey events yet.</Text> : null}
                  {!isLoading && !isError && events.length ? (
                    <div className="flex flex-col gap-2">
                      {events.slice(0, 8).map((event, index) => (
                        <div key={`${event.event_name || "event"}-${index}`} className="flex items-center justify-between gap-2">
                          <Text size="small">{event.event_name || "activity"}</Text>
                          <Text size="xsmall" className="text-ui-fg-subtle">
                            {formatDateTime(event.occurred_at)}
                          </Text>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </Container>

              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h3">Next best action</Heading>
                </div>
                <div className="px-6 py-4">
                  <Text size="small">
                    {flags.includes("Abandoned checkout")
                      ? "Send abandoned checkout recovery message."
                      : flags.includes("Signed up, no purchase")
                        ? "Trigger welcome offer for first purchase."
                        : flags.includes("First-time buyer")
                          ? "Send cross-sell recommendation."
                          : "Review timeline and follow up manually."}
                  </Text>
                </div>
              </Container>

              <Container className="divide-y p-0">
                <div className="px-6 py-4">
                  <Heading level="h3">Flags</Heading>
                </div>
                <div className="px-6 py-4">
                  {!flags.length ? (
                    <Text size="small">No active flags.</Text>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {flags.map((flag) => (
                        <Badge key={flag} color="grey" size="2xsmall">
                          {flag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Container>
            </div>
          )}
        </Drawer.Body>
      </Drawer.Content>
    </Drawer>
  )
}

export default CustomersPage
