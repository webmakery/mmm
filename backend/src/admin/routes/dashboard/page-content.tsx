import { Button, Container, Heading, StatusBadge, Text } from "@medusajs/ui"
import { Link } from "react-router-dom"
import { AdminHelpDrawer, openAdminHelpDrawer } from "../../components/admin-help-drawer"
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

const getSeverity = (value: number, warningThreshold: number, criticalThreshold: number) => {
  if (value >= criticalThreshold) {
    return { label: "Critical", color: "red" as const }
  }

  if (value >= warningThreshold) {
    return { label: "Warning", color: "orange" as const }
  }

  return { label: "Normal", color: "green" as const }
}

const asTargetGap = (actual: number, target: number, unit = "") => {
  const diff = actual - target

  if (Math.abs(diff) < 0.01) {
    return `On target (${target.toFixed(2)}${unit})`
  }

  if (diff > 0) {
    return `${diff.toFixed(2)}${unit} above target`
  }

  return `${Math.abs(diff).toFixed(2)}${unit} below target`
}

const summarizeSeries = (values: number[]) => {
  if (!values.length) {
    return { latest: 0, avg: 0, max: 0, min: 0, last7: 0, previous7: 0 }
  }

  const latest = values[values.length - 1] || 0
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length
  const max = Math.max(...values)
  const min = Math.min(...values)
  const last7 = values.slice(-7).reduce((sum, value) => sum + value, 0)
  const previous7 = values.slice(-14, -7).reduce((sum, value) => sum + value, 0)

  return { latest, avg, max, min, last7, previous7 }
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
  target,
  status,
}: {
  label: string
  value: string
  compare: string
  target?: string
  status: "green" | "red" | "orange" | "grey"
}) => {
  return (
    <Container className="px-3 py-3">
      <Text size="xsmall" className="text-ui-fg-subtle">{label}</Text>
      <Heading level="h2">{value}</Heading>
      <div className="mt-2 flex flex-col gap-2">
        <StatusBadge color={status}>{compare}</StatusBadge>
        {target ? (
          <Text size="xsmall" className="text-ui-fg-muted">{target}</Text>
        ) : null}
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
        <Button size="small" variant="secondary" className="mt-3" onClick={openAdminHelpDrawer}>
          Guide me
        </Button>
        <AdminHelpDrawer />
      </Container>
    )
  }

  const kpis = data.executive_kpis
  const revenueSeries = data.performance.revenue_trend_30_days
  const leadBookingSeries = data.performance.leads_vs_bookings_30_days
  const funnel = data.full_funnel

  const unassignedSeverity = getSeverity(data.operational_risks.unassigned_leads, 1, 5)
  const overdueSeverity = getSeverity(data.operational_risks.overdue_follow_ups, 1, 5)
  const unpaidSeverity = getSeverity(data.operational_risks.unpaid_orders, 1, 5)

  const revenueStats = summarizeSeries(revenueSeries.map((point) => point.value))
  const leadStats = summarizeSeries(leadBookingSeries.map((point) => point.leads))
  const bookingStats = summarizeSeries(leadBookingSeries.map((point) => point.bookings))

  const biggestDropoff = funnel.stages
    .map((stage, index) => {
      const previousCount = index > 0 ? funnel.stages[index - 1].count : stage.count
      const absoluteLoss = Math.max(previousCount - stage.count, 0)

      return {
        ...stage,
        absoluteLoss,
      }
    })
    .slice(1)
    .sort((a, b) => b.absoluteLoss - a.absoluteLoss)[0]

  const actionableInsights = [
    {
      id: "assign_owners",
      title: "Assign lead owners",
      detail:
        unassignedSeverity.label === "Normal"
          ? "No unassigned leads detected. Keep lead routing active."
          : `Assign owners to unassigned leads before end of day to protect conversion pace.`,
    },
    {
      id: "followup_queue",
      title: "Clear follow-up queue",
      detail:
        overdueSeverity.label === "Critical"
          ? "Run a same-day follow-up sprint for overdue leads and update next follow-up dates."
          : "Review due follow-ups and resolve by priority to avoid lead aging.",
    },
    {
      id: "payment_recovery",
      title: "Recover unpaid orders",
      detail:
        unpaidSeverity.label === "Normal"
          ? "No unpaid order risk detected."
          : `Prioritize collection outreach for ${data.operational_risks.unpaid_orders} unpaid orders with payment links.`,
    },
  ]

  return (
    <div className="flex flex-col gap-y-4">
      <AdminHelpDrawer />
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
            target={`Target: ${asCurrency(kpis.revenue_this_month.previous, data.currency_code)} · ${asTargetGap(
              kpis.revenue_this_month.value,
              kpis.revenue_this_month.previous
            )}`}
            status={kpis.revenue_this_month.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Bookings this month"
            value={`${kpis.bookings_this_month.value}`}
            compare={`${kpis.bookings_this_month.change_percent}% vs previous month`}
            target={`Target: ${kpis.bookings_this_month.previous} · ${asTargetGap(kpis.bookings_this_month.value, kpis.bookings_this_month.previous, "")}`}
            status={kpis.bookings_this_month.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Lead-to-booking conversion"
            value={`${kpis.lead_to_booking_conversion.value}%`}
            compare={`${kpis.lead_to_booking_conversion.change_percent}% vs previous month`}
            target={`Target: ${kpis.lead_to_booking_conversion.previous.toFixed(2)}% · ${asTargetGap(
              kpis.lead_to_booking_conversion.value,
              kpis.lead_to_booking_conversion.previous,
              "%"
            )}`}
            status={kpis.lead_to_booking_conversion.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Average order value"
            value={asCurrency(kpis.average_order_value.value, data.currency_code)}
            compare={`${kpis.average_order_value.change_percent}% vs previous month`}
            target={`Target: ${asCurrency(kpis.average_order_value.previous, data.currency_code)} · ${asTargetGap(
              kpis.average_order_value.value,
              kpis.average_order_value.previous
            )}`}
            status={kpis.average_order_value.change_percent >= 0 ? "green" : "red"}
          />
          <KpiCard
            label="Unpaid amount / risk"
            value={asCurrency(kpis.unpaid_amount.value, data.currency_code)}
            compare={`${kpis.unpaid_amount.unpaid_orders} unpaid orders`}
            target={`Target: ${asCurrency(kpis.unpaid_amount.previous, data.currency_code)} pending`}
            status={kpis.unpaid_amount.unpaid_orders > 0 ? "orange" : "green"}
          />
          <KpiCard
            label="Urgent action items"
            value={`${kpis.urgent_action_items.value}`}
            compare="Exceptions requiring follow-up"
            target="Target: 0 open exceptions"
            status={kpis.urgent_action_items.value > 0 ? "orange" : "green"}
          />
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">Operational risk watch</Heading>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3">
          <Container className="px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="small">Unassigned leads</Text>
              <StatusBadge color={unassignedSeverity.color}>{unassignedSeverity.label}</StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">{data.operational_risks.unassigned_leads} leads need owner assignment today.</Text>
          </Container>
          <Container className="px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="small">Overdue follow-ups</Text>
              <StatusBadge color={overdueSeverity.color}>{overdueSeverity.label}</StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">{data.operational_risks.overdue_follow_ups} follow-ups are overdue and should be cleared first.</Text>
          </Container>
          <Container className="px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="small">Unpaid orders</Text>
              <StatusBadge color={unpaidSeverity.color}>{unpaidSeverity.label}</StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">{data.operational_risks.unpaid_orders} orders need payment recovery outreach.</Text>
          </Container>
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
              Last day: {asCurrency(revenueStats.latest, data.currency_code)} · Avg/day: {asCurrency(revenueStats.avg, data.currency_code)}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Max/day: {asCurrency(revenueStats.max, data.currency_code)} · Min/day: {asCurrency(revenueStats.min, data.currency_code)}
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
            <Text size="xsmall" className="text-ui-fg-muted">
              Last 7 days: {leadStats.last7} leads / {bookingStats.last7} bookings
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Prior 7 days: {leadStats.previous7} leads / {bookingStats.previous7} bookings
            </Text>
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
            {funnel.stages.map((stage, index) => {
              const previousCount = index > 0 ? funnel.stages[index - 1].count : stage.count
              const absoluteLoss = Math.max(previousCount - stage.count, 0)
              const isBiggestDropoff = stage.key === biggestDropoff?.key
              const severity = index === 0 ? { color: "green" as const, label: "Normal" } : getSeverity(stage.dropoff_from_previous, 20, 35)

              return (
                <Container className="p-0" key={stage.key}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link to={stage.href} className="text-ui-fg-interactive text-small">
                      {stage.label}
                    </Link>
                    <StatusBadge color={severity.color}>{severity.label}</StatusBadge>
                  </div>
                  <div className="border-t px-4 py-2">
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {index === 0
                        ? "Entry stage"
                        : `Conversion ${asPercent(stage.conversion_from_previous)} · Drop-off ${asPercent(stage.dropoff_from_previous)} (${absoluteLoss} lost)`}
                    </Text>
                    {isBiggestDropoff ? (
                      <Text size="xsmall" className="text-ui-fg-muted mt-1">Largest bottleneck in funnel.</Text>
                    ) : null}
                  </div>
                </Container>
              )
            })}
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
            <Text size="small">Action guidance</Text>
            <div className="mt-2 space-y-2">
              {actionableInsights.map((insight) => (
                <Text size="small" key={insight.id} className="text-ui-fg-subtle">• {insight.title}: {insight.detail}</Text>
              ))}
              {funnel.insights.map((insight) => (
                <Text size="small" key={insight.id} className="text-ui-fg-subtle">• Monitor: {insight.detail}</Text>
              ))}
            </div>
          </Container>
        </div>
      </Container>
    </div>
  )
}

export default DashboardPageContent
