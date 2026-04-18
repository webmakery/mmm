import { Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { useDashboardData } from "./hooks"

const asCurrency = (amount: number, currencyCode?: string | null) => {
  if (!currencyCode) {
    return "—"
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100)
}

const asDate = (value?: string | null) => {
  if (!value) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return date.toLocaleString()
}

const toTitle = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ")

const asHours = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "—"
  }

  return `${value.toFixed(1)}h`
}

const asPercent = (value: number) => `${value.toFixed(2)}%`

const asChangeLabel = (value: number) => {
  if (value > 0) {
    return `↑ ${Math.abs(value).toFixed(2)}%`
  }

  if (value < 0) {
    return `↓ ${Math.abs(value).toFixed(2)}%`
  }

  return "0.00%"
}

const Sparkline = ({ values }: { values: number[] }) => {
  if (!values.length) {
    return ""
  }

  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"]
  const max = Math.max(...values)

  if (max <= 0) {
    return blocks[0].repeat(values.length)
  }

  return values
    .map((value) => {
      const index = Math.min(blocks.length - 1, Math.floor((value / max) * (blocks.length - 1)))
      return blocks[index]
    })
    .join("")
}

const KpiCard = ({
  label,
  value,
  compare,
  status,
}: {
  label: string
  value: string
  compare: string
  status: "green" | "red" | "orange" | "grey"
}) => {
  return (
    <Container className="px-3 py-3">
      <Text size="xsmall" className="text-ui-fg-subtle">{label}</Text>
      <Heading level="h2">{value}</Heading>
      <div className="mt-2 flex items-center gap-2">
        <StatusBadge color={status}>{compare}</StatusBadge>
      </div>
    </Container>
  )
}

const DashboardPageContent = () => {
  const { data, isLoading, isError } = useDashboardData()

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Loading dashboard data...
        </Text>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="p-6">
        <Heading level="h2">Dashboard unavailable</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          We could not load live admin metrics right now.
        </Text>
      </Container>
    )
  }

  const kpis = data.executive_kpis
  const revenueSeries = data.performance.revenue_trend_30_days
  const leadBookingSeries = data.performance.leads_vs_bookings_30_days
  const funnel = data.full_funnel

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Executive dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Performance, trend changes, risks, and actions from live business data.
          </Text>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            Updated {asDate(data.generated_at)} ({data.timezone})
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Revenue this month"
            value={asCurrency(kpis.revenue_this_month.value, data.currency_code)}
            compare={`${kpis.revenue_this_month.change_percent}% vs previous month`}
            status={kpis.revenue_this_month.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Bookings this month"
            value={`${kpis.bookings_this_month.value}`}
            compare={`${kpis.bookings_this_month.change_percent}% vs previous month`}
            status={kpis.bookings_this_month.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Lead-to-booking conversion"
            value={`${kpis.lead_to_booking_conversion.value}%`}
            compare={`${kpis.lead_to_booking_conversion.change_percent}% vs previous month`}
            status={kpis.lead_to_booking_conversion.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Average order value"
            value={asCurrency(kpis.average_order_value.value, data.currency_code)}
            compare={`${kpis.average_order_value.change_percent}% vs previous month`}
            status={kpis.average_order_value.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Unpaid amount / risk"
            value={asCurrency(kpis.unpaid_amount.value, data.currency_code)}
            compare={`${kpis.unpaid_amount.unpaid_orders} unpaid orders`}
            status={kpis.unpaid_amount.unpaid_orders > 0 ? "orange" : "green"}
          />
          <KpiCard
            label="Urgent action items"
            value={`${kpis.urgent_action_items.value}`}
            compare="Exceptions requiring follow-up"
            status={kpis.urgent_action_items.value > 0 ? "orange" : "green"}
          />
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Business snapshot</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2">
          {data.snapshot_insights.map((insight) => (
            <Container className="px-3 py-3" key={insight.id}>
              <Text size="small">{insight.title}</Text>
              <Text size="small" className="text-ui-fg-subtle">{insight.detail}</Text>
            </Container>
          ))}
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Performance</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Revenue trend (30 days)</Text>
            <Heading level="h2" className="font-mono">{Sparkline({ values: revenueSeries.map((point) => point.value) })}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Total: {asCurrency(revenueSeries.reduce((sum, point) => sum + point.value, 0), data.currency_code)}
            </Text>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Leads vs bookings trend (30 days)</Text>
            <Heading level="h2" className="font-mono">
              L {Sparkline({ values: leadBookingSeries.map((point) => point.leads) })}
            </Heading>
            <Heading level="h3" className="font-mono">
              B {Sparkline({ values: leadBookingSeries.map((point) => point.bookings) })}
            </Heading>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Funnel conversion by stage</Text>
            <div className="mt-2 space-y-2">
              {data.performance.funnel_conversion_by_stage.slice(0, 4).map((stage) => (
                <div className="flex items-center justify-between" key={stage.stage}>
                  <Text size="xsmall">{toTitle(stage.stage)}</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{stage.count} ({stage.share}%)</Text>
                </div>
              ))}
            </div>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Top services / products</Text>
            <div className="mt-2 space-y-2">
              {data.performance.top_services_by_bookings.slice(0, 2).map((item) => (
                <div className="flex items-center justify-between" key={`service-${item.label}`}>
                  <Text size="xsmall">{item.label}</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{item.bookings} bookings</Text>
                </div>
              ))}
              {data.performance.top_products_by_revenue.slice(0, 2).map((item) => (
                <div className="flex items-center justify-between" key={`product-${item.label}`}>
                  <Text size="xsmall">{item.label}</Text>
                  <Text size="xsmall" className="text-ui-fg-subtle">{asCurrency(item.revenue, data.currency_code)}</Text>
                </div>
              ))}
            </div>
          </Container>
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Full Funnel Performance</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Leads → Qualified → Bookings → Completed → Paid
          </Text>
        </div>

        <div className="px-6 py-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {funnel.stages.map((stage, index) => (
              <Container className="p-0" key={stage.key}>
                <div className="flex items-center justify-between px-4 py-3">
                  <Link to={stage.href} className="text-ui-fg-interactive text-small">
                    {stage.label}
                  </Link>
                  <StatusBadge color={index === 0 || stage.dropoff_from_previous < 30 ? "green" : "orange"}>
                    {stage.count}
                  </StatusBadge>
                </div>
                <div className="border-t px-4 py-2">
                  <Text size="xsmall" className="text-ui-fg-subtle">
                    {index === 0 ? "Entry stage" : `Conversion ${asPercent(stage.conversion_from_previous)} · Drop-off ${asPercent(stage.dropoff_from_previous)}`}
                  </Text>
                </div>
              </Container>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Lead → Booking conversion</Text>
            <Heading level="h2">{asPercent(funnel.derived_metrics.lead_to_booking_conversion)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Week {asChangeLabel(funnel.period_comparison.week.lead_to_booking_change_percent)} · Month {asChangeLabel(funnel.period_comparison.month.lead_to_booking_change_percent)}
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Booking → Paid conversion</Text>
            <Heading level="h2">{asPercent(funnel.derived_metrics.booking_to_paid_conversion)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Week {asChangeLabel(funnel.period_comparison.week.booking_to_paid_change_percent)} · Month {asChangeLabel(funnel.period_comparison.month.booking_to_paid_change_percent)}
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Overall funnel conversion</Text>
            <Heading level="h2">{asPercent(funnel.derived_metrics.overall_funnel_conversion)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Paid share of all leads
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">Average stage velocity</Text>
            <Heading level="h2">{asHours(funnel.derived_metrics.average_hours_lead_to_booking)} / {asHours(funnel.derived_metrics.average_hours_booking_to_payment)}</Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Lead→Booking / Booking→Payment
            </Text>
          </Container>
        </div>

        <div className="px-6 pb-4">
          <Container className="px-3 py-3">
            <Text size="small">Insights</Text>
            <div className="mt-2 space-y-2">
              {funnel.insights.map((insight) => (
                <Text size="small" key={insight.id} className="text-ui-fg-subtle">• {insight.detail}</Text>
              ))}
            </div>
          </Container>
        </div>
      </Container>
    </div>
  )
}

export default DashboardPageContent
