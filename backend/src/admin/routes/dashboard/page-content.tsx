import { Button, Container, Heading, StatusBadge, Text } from "@medusajs/ui";
import { Link } from "react-router-dom";
import { openAdminHelpDrawer } from "../../components/admin-help-drawer";
import { useDashboardData } from "./hooks";

const asCurrency = (amount: number, currencyCode?: string | null) => {
  if (!currencyCode) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(amount / 100);
};

const asDate = (value?: string | null) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleString();
};

const toTitle = (value: string) =>
  value
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : ""))
    .join(" ");

const asHours = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return `${value.toFixed(1)}h`;
};

const asPercent = (value: number) => `${value.toFixed(2)}%`;
const asCount = (value: number) =>
  new Intl.NumberFormat().format(Math.max(0, Math.round(value)));

const asChangeLabel = (value: number) => {
  if (value > 0) {
    return `↑ ${Math.abs(value).toFixed(2)}%`;
  }

  if (value < 0) {
    return `↓ ${Math.abs(value).toFixed(2)}%`;
  }

  return "0.00%";
};

const asDeltaLabel = (
  current: number,
  previous: number,
  formatter: (value: number) => string,
) => {
  const change = getChangeFromTotals(current, previous);
  return `${formatter(current)} (${asChangeLabel(change)} vs last 7d)`;
};

const getBand = (
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
) => {
  if (value >= criticalThreshold) {
    return { label: "Red", color: "red" as const };
  }

  if (value >= warningThreshold) {
    return { label: "Yellow", color: "orange" as const };
  }

  return { label: "Green", color: "green" as const };
};

const getBandWithSampleGate = (
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
  sampleSize: number,
  minimumSampleSize: number,
) => {
  if (sampleSize < minimumSampleSize) {
    return { label: "Insufficient data", color: "grey" as const };
  }

  return getBand(value, warningThreshold, criticalThreshold);
};

const getSeverity = (
  value: number,
  warningThreshold: number,
  criticalThreshold: number,
) => {
  if (value >= criticalThreshold) {
    return { label: "Critical", color: "red" as const };
  }

  if (value >= warningThreshold) {
    return { label: "Warning", color: "orange" as const };
  }

  return { label: "Normal", color: "green" as const };
};

const asTargetGap = (actual: number, target: number, unit = "") => {
  const diff = actual - target;

  if (Math.abs(diff) < 0.01) {
    return `On target (${target.toFixed(2)}${unit})`;
  }

  if (diff > 0) {
    return `${diff.toFixed(2)}${unit} above target`;
  }

  return `${Math.abs(diff).toFixed(2)}${unit} below target`;
};

const summarizeSeries = (values: number[]) => {
  if (!values.length) {
    return { latest: 0, avg: 0, max: 0, min: 0, last7: 0, previous7: 0 };
  }

  const latest = values[values.length - 1] || 0;
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const last7 = values.slice(-7).reduce((sum, value) => sum + value, 0);
  const previous7 = values
    .slice(-14, -7)
    .reduce((sum, value) => sum + value, 0);

  return { latest, avg, max, min, last7, previous7 };
};

const Sparkline = ({ values }: { values: number[] }) => {
  if (!values.length) {
    return "";
  }

  const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
  const max = Math.max(...values);

  if (max <= 0) {
    return blocks[0].repeat(values.length);
  }

  return values
    .map((value) => {
      const index = Math.min(
        blocks.length - 1,
        Math.floor((value / max) * (blocks.length - 1)),
      );
      return blocks[index];
    })
    .join("");
};

const getChangeFromTotals = (current: number, previous: number) => {
  if (!previous) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
};

const KpiCard = ({
  label,
  value,
  compare,
  target,
  status,
}: {
  label: string;
  value: string;
  compare: string;
  target?: string;
  status: "green" | "red" | "orange" | "grey";
}) => {
  return (
    <Container className="px-3 py-3">
      <Text size="xsmall" className="text-ui-fg-subtle">
        {label}
      </Text>
      <Heading level="h2">{value}</Heading>
      <div className="mt-2 flex flex-col gap-2">
        <StatusBadge color={status}>{compare}</StatusBadge>
        {target ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            {target}
          </Text>
        ) : null}
      </div>
    </Container>
  );
};

const DashboardPageContent = () => {
  const { data, isLoading, isError } = useDashboardData();

  if (isLoading) {
    return (
      <Container className="p-6">
        <Text size="small" className="text-ui-fg-subtle">
          Loading dashboard data...
        </Text>
      </Container>
    );
  }

  if (isError || !data) {
    return (
      <Container className="p-6">
        <Heading level="h2">Dashboard unavailable</Heading>
        <Text size="small" className="text-ui-fg-subtle">
          We could not load live admin metrics right now.
        </Text>
        <Button
          size="small"
          variant="secondary"
          className="mt-3"
          onClick={openAdminHelpDrawer}
        >
          Guide me
        </Button>
      </Container>
    );
  }

  const kpis = data.executive_kpis;
  const revenueSeries = data.performance.revenue_trend_30_days;
  const leadBookingSeries = data.performance.leads_vs_bookings_30_days;
  const signupSeries = data.performance.signups_30_days;
  const checkoutStartsSeries = data.performance.checkout_starts_30_days;
  const funnel = data.full_funnel;
  const stageCount = (
    key: "leads" | "qualified" | "bookings" | "completed" | "paid",
  ) => funnel.stages.find((stage) => stage.key === key)?.count || 0;

  const unassignedSeverity = getSeverity(
    data.operational_risks.unassigned_leads,
    1,
    5,
  );
  const overdueSeverity = getSeverity(
    data.operational_risks.overdue_follow_ups,
    1,
    5,
  );
  const unpaidSeverity = getSeverity(
    data.operational_risks.unpaid_orders,
    1,
    5,
  );

  const revenueStats = summarizeSeries(
    revenueSeries.map((point) => point.value),
  );
  const leadStats = summarizeSeries(
    leadBookingSeries.map((point) => point.leads),
  );
  const bookingStats = summarizeSeries(
    leadBookingSeries.map((point) => point.bookings),
  );
  const signupStats = summarizeSeries(signupSeries.map((point) => point.value));
  const checkoutStartsStats = summarizeSeries(
    checkoutStartsSeries.map((point) => point.value),
  );
  const MIN_TRAFFIC_SAMPLE = 100;
  const MIN_ORDER_SAMPLE = 10;
  const qualifiedCount = stageCount("qualified");
  const bookingsCount = stageCount("bookings");
  const paidCount = stageCount("paid");
  const checkoutDropoff =
    funnel.stages.find((stage) => stage.key === "completed")
      ?.dropoff_from_previous || 0;
  const purchasesLast7 = Math.round(
    (paidCount / Math.max(bookingsCount, 1)) * bookingStats.last7,
  );

  const biggestDropoff = funnel.stages
    .map((stage, index) => {
      const previousCount =
        index > 0 ? funnel.stages[index - 1].count : stage.count;
      const absoluteLoss = Math.max(previousCount - stage.count, 0);

      return {
        ...stage,
        absoluteLoss,
      };
    })
    .slice(1)
    .sort((a, b) => b.absoluteLoss - a.absoluteLoss)[0];

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
  ];

  const trafficBand = getBandWithSampleGate(
    Math.max(0, -leadStats.last7 + leadStats.previous7),
    leadStats.previous7 * 0.1,
    leadStats.previous7 * 0.2,
    leadStats.last7,
    MIN_TRAFFIC_SAMPLE,
  );
  const engagedBand = getBandWithSampleGate(
    Math.max(0, -qualifiedCount + Math.round(qualifiedCount * 0.1)),
    Math.max(qualifiedCount * 0.1, 10),
    Math.max(qualifiedCount * 0.2, 20),
    qualifiedCount,
    MIN_TRAFFIC_SAMPLE,
  );
  const signupBand = getBandWithSampleGate(
    Math.max(0, -kpis.lead_to_booking_conversion.change_percent),
    10,
    20,
    Math.min(leadStats.last7, bookingStats.last7),
    MIN_ORDER_SAMPLE,
  );
  const checkoutBand = getBandWithSampleGate(
    Math.max(0, checkoutDropoff),
    20,
    35,
    bookingStats.last7,
    MIN_ORDER_SAMPLE,
  );
  const purchaseBand = getBandWithSampleGate(
    Math.max(
      0,
      funnel.stages.find((stage) => stage.key === "paid")
        ?.dropoff_from_previous || 0,
    ),
    20,
    35,
    purchasesLast7,
    MIN_ORDER_SAMPLE,
  );
  const aovBand = getBandWithSampleGate(
    Math.max(0, -kpis.average_order_value.change_percent),
    5,
    10,
    bookingsCount,
    MIN_ORDER_SAMPLE,
  );
  const ltvProxyBand = getBandWithSampleGate(
    Math.max(0, -funnel.period_comparison.month.booking_to_paid_change_percent),
    10,
    15,
    bookingsCount,
    MIN_ORDER_SAMPLE,
  );
  const timeToFirstPurchaseBand = getBand(
    Math.max(0, funnel.derived_metrics.average_hours_lead_to_booking - 72),
    12,
    24,
  );

  const kpiPlaybook = [
    {
      section: "Acquisition (Proxy KPIs)",
      items: [
        {
          id: "traffic_by_source",
          metric: "Traffic by source (proxy)",
          threshold: "Yellow: -10% / Red: -20% vs 4-week baseline",
          state: trafficBand,
          value: `${asCount(leadStats.last7 + bookingStats.last7)} visits`,
          context: `${asCount(leadStats.last7 + bookingStats.last7)} visits in last 7d / ${asCount(leadStats.previous7 + bookingStats.previous7)} previous 7d`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(revenueStats.latest, revenueStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(
              leadStats.last7 + bookingStats.last7,
              leadStats.previous7 + bookingStats.previous7,
            ),
          )} · MoM: ${asChangeLabel(kpis.revenue_this_month.change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries
              .map((point) => point.leads + point.bookings)
              .slice(-14),
          }),
          owner: "Marketing",
          alertReason:
            trafficBand.label === "Insufficient data"
              ? `Insufficient data: need at least ${MIN_TRAFFIC_SAMPLE} visits before status coloring.`
              : trafficBand.label === "Red"
                ? `Red because traffic proxy is ${asChangeLabel(
                    getChangeFromTotals(
                      leadStats.last7 + bookingStats.last7,
                      leadStats.previous7 + bookingStats.previous7,
                    ),
                  )} vs prior 7d baseline.`
                : `Status ${trafficBand.label} based on traffic proxy versus prior baseline.`,
          signal: `Revenue trend proxy: ${asCurrency(revenueStats.latest, data.currency_code)} latest day vs ${asCurrency(revenueStats.avg, data.currency_code)} avg/day.`,
          action:
            "Verify tracking + campaign delivery today, then shift 10–20% budget to stable sources if decline persists.",
          href: "/leads",
        },
        {
          id: "engaged_visitors",
          metric: "Engaged visitors by source",
          threshold: "Yellow: -10% / Red: -20% vs prior 7 days",
          state: engagedBand,
          value: `${asCount(qualifiedCount)} engaged visitors`,
          context: `${asCount(qualifiedCount)} qualified leads in current sample`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(leadStats.latest, leadStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(leadStats.last7, leadStats.previous7),
          )} · MoM: ${asChangeLabel(kpis.bookings_this_month.change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries.map((point) => point.leads).slice(-14),
          }),
          owner: "Growth",
          alertReason:
            engagedBand.label === "Red"
              ? `Red because engaged visitors are ${asChangeLabel(getChangeFromTotals(leadStats.last7, leadStats.previous7))} vs prior 7d.`
              : `Status ${engagedBand.label} based on engaged visitor trend.`,
          signal: "Qualified lead signal from current funnel stage counts.",
          action:
            "Pause the weakest ad set and tighten creative-to-landing page match.",
          href: "/leads",
        },
        {
          id: "signup_rate",
          metric: "Signup rate by source",
          threshold: "Yellow: -10% / Red: -20% vs baseline",
          state: signupBand,
          value: `${asPercent(kpis.lead_to_booking_conversion.value)} (${asCount(bookingStats.last7)} bookings / ${asCount(leadStats.last7)} leads)`,
          context: `${asPercent(kpis.lead_to_booking_conversion.value)} conversion with raw booking and lead counts`,
          trends: `Today vs yesterday: ${asChangeLabel(
            getChangeFromTotals(
              bookingStats.latest,
              Math.max(leadStats.latest, 1),
            ) -
              getChangeFromTotals(bookingStats.avg, Math.max(leadStats.avg, 1)),
          )} · 7d: ${asChangeLabel(
            getChangeFromTotals(
              bookingStats.last7 / Math.max(leadStats.last7, 1),
              bookingStats.previous7 / Math.max(leadStats.previous7, 1),
            ),
          )} · MoM: ${asChangeLabel(kpis.lead_to_booking_conversion.change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries
              .map((point) => (point.bookings / Math.max(point.leads, 1)) * 100)
              .slice(-14),
          }),
          owner: "Product",
          alertReason:
            signupBand.label === "Red"
              ? `Red because lead-to-booking conversion is down ${Math.abs(kpis.lead_to_booking_conversion.change_percent).toFixed(2)}% month over month.`
              : `Status ${signupBand.label} based on conversion change versus baseline.`,
          signal: `Lead-to-booking trend: ${asChangeLabel(kpis.lead_to_booking_conversion.change_percent)} month over month.`,
          action:
            "Run one landing/form A/B test this week and ship the winner.",
          href: "/leads",
        },
      ],
    },
    {
      section: "Conversion (Real KPIs)",
      items: [
        {
          id: "checkout_rate",
          metric: "Checkout rate by source",
          threshold: "Yellow: +20% dropoff / Red: +35% dropoff",
          state: checkoutBand,
          value: `${asPercent(checkoutDropoff)} (${asCount(stageCount("bookings") - stageCount("completed"))} lost / ${asCount(
            stageCount("bookings"),
          )} checkout starts)`,
          context: `${asCount(stageCount("completed"))} completed from ${asCount(stageCount("bookings"))} checkout starts`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(bookingStats.latest, bookingStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(bookingStats.last7, bookingStats.previous7),
          )} · MoM: ${asChangeLabel(funnel.period_comparison.month.lead_to_booking_change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries.map((point) => point.bookings).slice(-14),
          }),
          owner: "Product",
          alertReason:
            checkoutBand.label === "Insufficient data"
              ? `Insufficient data: need at least ${MIN_ORDER_SAMPLE} checkout starts before status coloring.`
              : `Status ${checkoutBand.label} based on bookings→completed dropoff.`,
          signal: `Checkout starts: ${asCount(stageCount("bookings"))} · Completed: ${asCount(stageCount("completed"))}.`,
          action:
            "Review checkout/payment failures and mobile checkout speed today.",
          href: "/bookings",
        },
        {
          id: "purchase_rate",
          metric: "Purchase rate by source",
          threshold: "Yellow: +20% paid-stage dropoff / Red: +35%",
          state: purchaseBand,
          value: `${asPercent(funnel.derived_metrics.booking_to_paid_conversion)} (${asCount(
            stageCount("paid"),
          )} paid / ${asCount(stageCount("bookings"))} bookings)`,
          context: `${asCount(stageCount("paid"))} paid outcomes from booking volume`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(revenueStats.latest, revenueStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(bookingStats.last7, bookingStats.previous7),
          )} · MoM: ${asChangeLabel(funnel.period_comparison.month.booking_to_paid_change_percent)}`,
          sparkline: Sparkline({
            values: revenueSeries.map((point) => point.value).slice(-14),
          }),
          owner: "CRM",
          alertReason:
            purchaseBand.label === "Insufficient data"
              ? `Insufficient data: need at least ${MIN_ORDER_SAMPLE} purchases before status coloring.`
              : purchaseBand.label === "Red"
                ? `Red because paid-stage dropoff is ${asPercent(funnel.stages.find((stage) => stage.key === "paid")?.dropoff_from_previous || 0)} vs baseline.`
                : `Status ${purchaseBand.label} based on booking-to-paid trend.`,
          signal: `Booking→Paid: ${asPercent(funnel.derived_metrics.booking_to_paid_conversion)} (${asChangeLabel(
            funnel.period_comparison.month.booking_to_paid_change_percent,
          )} month).`,
          action:
            "Trigger checkout recovery at 30m and 6h and review payment failures.",
          href: "/orders",
        },
        {
          id: "revenue_orders",
          metric: "Revenue, orders_count, total_revenue",
          threshold: "Yellow: -10% / Red: -20% vs prior period",
          state:
            kpis.revenue_this_month.change_percent < -20
              ? { label: "Red", color: "red" as const }
              : kpis.revenue_this_month.change_percent < -10
                ? { label: "Yellow", color: "orange" as const }
                : { label: "Green", color: "green" as const },
          value: `${asCurrency(kpis.revenue_this_month.value, data.currency_code)} (${asCount(kpis.bookings_this_month.value)} orders)`,
          context: `${asCurrency(kpis.revenue_this_month.value, data.currency_code)} this month / ${asCurrency(
            kpis.revenue_this_month.previous,
            data.currency_code,
          )} last month`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(revenueStats.latest, revenueStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(revenueStats.last7, revenueStats.previous7),
          )} · MoM: ${asChangeLabel(kpis.revenue_this_month.change_percent)}`,
          sparkline: Sparkline({
            values: revenueSeries.map((point) => point.value).slice(-14),
          }),
          owner: "Finance",
          alertReason:
            kpis.revenue_this_month.change_percent < -20
              ? `Red because revenue is down ${Math.abs(kpis.revenue_this_month.change_percent).toFixed(2)}% month over month.`
              : `Status based on month-over-month revenue change.`,
          signal: `Revenue ${asChangeLabel(kpis.revenue_this_month.change_percent)} · Bookings ${asChangeLabel(kpis.bookings_this_month.change_percent)} month over month.`,
          action:
            "Reduce spend in weak sources and push cart/checkout recovery immediately when trend weakens.",
          href: "/orders",
        },
      ],
    },
    {
      section: "Retention",
      items: [
        {
          id: "aov",
          metric: "AOV",
          threshold: "Yellow: -5% / Red: -10%",
          state: aovBand,
          value: `${asCurrency(kpis.average_order_value.value, data.currency_code)} AOV`,
          context: `${asCurrency(kpis.average_order_value.value, data.currency_code)} current / ${asCurrency(
            kpis.average_order_value.previous,
            data.currency_code,
          )} previous month`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(revenueStats.latest, revenueStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(revenueStats.last7, revenueStats.previous7),
          )} · MoM: ${asChangeLabel(kpis.average_order_value.change_percent)}`,
          sparkline: Sparkline({
            values: revenueSeries.map((point) => point.value).slice(-14),
          }),
          owner: "Merchandising",
          alertReason:
            aovBand.label === "Insufficient data"
              ? `Insufficient data: need at least ${MIN_ORDER_SAMPLE} orders before AOV status coloring.`
              : aovBand.label === "Red"
                ? `Red because AOV is down ${Math.abs(kpis.average_order_value.change_percent).toFixed(2)}% month over month.`
                : `Status ${aovBand.label} based on AOV month trend.`,
          signal: `AOV change: ${asChangeLabel(kpis.average_order_value.change_percent)} month over month.`,
          action:
            "Enable bundles, in-cart cross-sell, and free-shipping threshold messaging.",
          href: "/orders",
        },
        {
          id: "ltv",
          metric: "LTV (proxy)",
          threshold: "Yellow: -10% / Red: -15% (cohort trend)",
          state: ltvProxyBand,
          value: `${asPercent(funnel.derived_metrics.booking_to_paid_conversion)} repeat proxy`,
          context: `${asPercent(funnel.derived_metrics.booking_to_paid_conversion)} booking-to-paid conversion as retention proxy`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(bookingStats.latest, bookingStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(bookingStats.last7, bookingStats.previous7),
          )} · MoM: ${asChangeLabel(funnel.period_comparison.month.booking_to_paid_change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries.map((point) => point.bookings).slice(-14),
          }),
          owner: "CRM",
          alertReason:
            ltvProxyBand.label === "Insufficient data"
              ? `Insufficient data: need at least ${MIN_ORDER_SAMPLE} bookings before this proxy status appears.`
              : ltvProxyBand.label === "Red"
                ? `Red because booking-to-paid trend is down ${Math.abs(funnel.period_comparison.month.booking_to_paid_change_percent).toFixed(2)}% month over month.`
                : `Status ${ltvProxyBand.label} based on cohort trend proxy.`,
          signal: `LTV proxy via booking→paid trend: ${asChangeLabel(
            funnel.period_comparison.month.booking_to_paid_change_percent,
          )}.`,
          action:
            "Prioritize win-back and repeat purchase CRM before scaling paid acquisition.",
          href: "/orders",
        },
        {
          id: "days_to_first_purchase",
          metric: "Days to first purchase",
          threshold: "Yellow: +10% slower / Red: +20% slower",
          state: timeToFirstPurchaseBand,
          value: `${asHours(funnel.derived_metrics.average_hours_lead_to_booking)} avg`,
          context: `${asHours(funnel.derived_metrics.average_hours_lead_to_booking)} lead→booking / ${asHours(
            funnel.derived_metrics.average_hours_booking_to_payment,
          )} booking→payment`,
          trends: `Today vs yesterday: ${asChangeLabel(getChangeFromTotals(bookingStats.latest, bookingStats.avg))} · 7d: ${asChangeLabel(
            getChangeFromTotals(bookingStats.last7, bookingStats.previous7),
          )} · MoM: ${asChangeLabel(funnel.period_comparison.month.lead_to_booking_change_percent)}`,
          sparkline: Sparkline({
            values: leadBookingSeries.map((point) => point.bookings).slice(-14),
          }),
          owner: "Lifecycle",
          alertReason:
            timeToFirstPurchaseBand.label === "Red"
              ? `Red because lead→booking cycle time is ${asHours(funnel.derived_metrics.average_hours_lead_to_booking)} and above threshold.`
              : `Status ${timeToFirstPurchaseBand.label} based on cycle-time target.`,
          signal: `Current lead→booking velocity: ${asHours(funnel.derived_metrics.average_hours_lead_to_booking)}.`,
          action:
            "Tighten first-72h onboarding with first-order incentive and reminder flow.",
          href: "/leads",
        },
      ],
    },
  ];

  const summaryKpis: Array<{
    id: string;
    label: string;
    value: string;
    compare: string;
    status: "green" | "red" | "orange" | "grey";
    href: string;
  }> = [
    {
      id: "summary_traffic",
      label: "Traffic",
      value: asCount(leadStats.last7 + bookingStats.last7),
      compare: asDeltaLabel(
        leadStats.last7 + bookingStats.last7,
        leadStats.previous7 + bookingStats.previous7,
        asCount,
      ),
      status: trafficBand.color,
      href: "/leads",
    },
    {
      id: "summary_engaged",
      label: "Engaged visitors",
      value: asCount(qualifiedCount),
      compare: `${asCount(qualifiedCount)} qualified currently`,
      status: engagedBand.color,
      href: "/leads",
    },
    {
      id: "summary_signups",
      label: "Signups",
      value: asCount(signupStats.last7),
      compare: asDeltaLabel(
        signupStats.last7,
        signupStats.previous7,
        asCount,
      ),
      status: signupBand.color,
      href: "/leads",
    },
    {
      id: "summary_checkout_starts",
      label: "Checkout starts",
      value: asCount(checkoutStartsStats.last7),
      compare: asDeltaLabel(
        checkoutStartsStats.last7,
        checkoutStartsStats.previous7,
        asCount,
      ),
      status: checkoutBand.color,
      href: "/bookings",
    },
    {
      id: "summary_purchases",
      label: "Purchases",
      value: asCount(purchasesLast7),
      compare: `${asPercent(funnel.derived_metrics.booking_to_paid_conversion)} booking→paid`,
      status: purchaseBand.color,
      href: "/orders",
    },
    {
      id: "summary_revenue",
      label: "Revenue",
      value: asCurrency(revenueStats.last7, data.currency_code),
      compare: asDeltaLabel(
        revenueStats.last7,
        revenueStats.previous7,
        (amount) => asCurrency(amount, data.currency_code),
      ),
      status: kpis.revenue_this_month.change_percent >= 0 ? "green" : "red",
      href: "/orders",
    },
  ];

  return (
    <div className="flex flex-col gap-y-4">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Executive dashboard</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Performance, trend changes, risks, and actions from live business
            data.
          </Text>
          <Text size="xsmall" className="mt-1 text-ui-fg-muted">
            Updated {asDate(data.generated_at)} ({data.timezone})
          </Text>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Revenue this month"
            value={asCurrency(
              kpis.revenue_this_month.value,
              data.currency_code,
            )}
            compare={`${kpis.revenue_this_month.change_percent}% vs previous month`}
            target={`Target: ${asCurrency(kpis.revenue_this_month.previous, data.currency_code)} · ${asTargetGap(
              kpis.revenue_this_month.value,
              kpis.revenue_this_month.previous,
            )}`}
            status={
              kpis.revenue_this_month.change_percent >= 0 ? "green" : "red"
            }
          />
          <KpiCard
            label="Bookings this month"
            value={`${kpis.bookings_this_month.value}`}
            compare={`${kpis.bookings_this_month.change_percent}% vs previous month`}
            target={`Target: ${kpis.bookings_this_month.previous} · ${asTargetGap(kpis.bookings_this_month.value, kpis.bookings_this_month.previous, "")}`}
            status={
              kpis.bookings_this_month.change_percent >= 0 ? "green" : "red"
            }
          />
          <KpiCard
            label="Lead-to-booking conversion"
            value={`${kpis.lead_to_booking_conversion.value}%`}
            compare={`${kpis.lead_to_booking_conversion.change_percent}% vs previous month`}
            target={`Target: ${kpis.lead_to_booking_conversion.previous.toFixed(2)}% · ${asTargetGap(
              kpis.lead_to_booking_conversion.value,
              kpis.lead_to_booking_conversion.previous,
              "%",
            )}`}
            status={
              kpis.lead_to_booking_conversion.change_percent >= 0
                ? "green"
                : "red"
            }
          />
          <KpiCard
            label="Average order value"
            value={asCurrency(
              kpis.average_order_value.value,
              data.currency_code,
            )}
            compare={`${kpis.average_order_value.change_percent}% vs previous month`}
            target={`Target: ${asCurrency(kpis.average_order_value.previous, data.currency_code)} · ${asTargetGap(
              kpis.average_order_value.value,
              kpis.average_order_value.previous,
            )}`}
            status={
              kpis.average_order_value.change_percent >= 0 ? "green" : "red"
            }
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
          <Heading level="h2">Weekly summary</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Current values with last-7-day comparison for quick scans.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-3 xl:grid-cols-6">
          {summaryKpis.map((item) => (
            <Link key={item.id} to={item.href}>
              <KpiCard
                label={item.label}
                value={item.value}
                compare={item.compare}
                status={item.status}
              />
            </Link>
          ))}
        </div>
      </Container>

      <Container className="p-0">
        <div className="px-6 py-4">
          <Heading level="h2">KPI decision playbook</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Thresholds and if-this-then-that rules for weekly decisions.
          </Text>
        </div>
        <div className="grid grid-cols-1 gap-3 px-6 py-4 xl:grid-cols-3">
          {kpiPlaybook.map((group) => (
            <Container key={group.section} className="px-3 py-3">
              <Heading level="h3">{group.section}</Heading>
              <div className="mt-3 space-y-3">
                {group.items.map((item) => (
                  <Container key={item.id} className="px-3 py-3">
                    <div className="flex items-center justify-between">
                      <Link
                        to={item.href}
                        className="text-ui-fg-interactive text-small"
                      >
                        {item.metric}
                      </Link>
                      <StatusBadge color={item.state.color}>
                        {item.state.label}
                      </StatusBadge>
                    </div>
                    <Text size="xsmall" className="mt-2 text-ui-fg-muted">
                      {item.threshold}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                      KPI: {item.value}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                      Context: {item.context}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                      Trend: {item.trends}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                      Last 14d: {item.sparkline}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                      {item.signal}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                      Owner: {item.owner}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-subtle">
                      Next action: {item.action}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                      Alert reason: {item.alertReason}
                    </Text>
                    <Text size="xsmall" className="mt-1 text-ui-fg-muted">
                      Last updated: {asDate(data.generated_at)}
                    </Text>
                  </Container>
                ))}
              </div>
            </Container>
          ))}
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
              <StatusBadge color={unassignedSeverity.color}>
                {unassignedSeverity.label}
              </StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              {data.operational_risks.unassigned_leads} leads need owner
              assignment today.
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="small">Overdue follow-ups</Text>
              <StatusBadge color={overdueSeverity.color}>
                {overdueSeverity.label}
              </StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              {data.operational_risks.overdue_follow_ups} follow-ups are overdue
              and should be cleared first.
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <div className="flex items-center justify-between">
              <Text size="small">Unpaid orders</Text>
              <StatusBadge color={unpaidSeverity.color}>
                {unpaidSeverity.label}
              </StatusBadge>
            </div>
            <Text size="small" className="text-ui-fg-subtle mt-2">
              {data.operational_risks.unpaid_orders} orders need payment
              recovery outreach.
            </Text>
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
              <Text size="small" className="text-ui-fg-subtle">
                {insight.detail}
              </Text>
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
            <Text size="xsmall" className="text-ui-fg-subtle">
              Revenue trend (30 days)
            </Text>
            <Heading level="h2" className="font-mono">
              {Sparkline({ values: revenueSeries.map((point) => point.value) })}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Last day: {asCurrency(revenueStats.latest, data.currency_code)} ·
              Avg/day: {asCurrency(revenueStats.avg, data.currency_code)}
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Max/day: {asCurrency(revenueStats.max, data.currency_code)} ·
              Min/day: {asCurrency(revenueStats.min, data.currency_code)}
            </Text>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Leads vs bookings trend (30 days)
            </Text>
            <Heading level="h2" className="font-mono">
              L{" "}
              {Sparkline({
                values: leadBookingSeries.map((point) => point.leads),
              })}
            </Heading>
            <Heading level="h3" className="font-mono">
              B{" "}
              {Sparkline({
                values: leadBookingSeries.map((point) => point.bookings),
              })}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Last 7 days: {leadStats.last7} leads / {bookingStats.last7}{" "}
              bookings
            </Text>
            <Text size="xsmall" className="text-ui-fg-muted">
              Prior 7 days: {leadStats.previous7} leads /{" "}
              {bookingStats.previous7} bookings
            </Text>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Funnel conversion by stage
            </Text>
            <div className="mt-2 space-y-2">
              {data.performance.funnel_conversion_by_stage
                .slice(0, 4)
                .map((stage) => (
                  <div
                    className="flex items-center justify-between"
                    key={stage.stage}
                  >
                    <Text size="xsmall">{toTitle(stage.stage)}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {stage.count} ({stage.share}%)
                    </Text>
                  </div>
                ))}
            </div>
          </Container>

          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Top services / products
            </Text>
            <div className="mt-2 space-y-2">
              {data.performance.top_services_by_bookings
                .slice(0, 2)
                .map((item) => (
                  <div
                    className="flex items-center justify-between"
                    key={`service-${item.label}`}
                  >
                    <Text size="xsmall">{item.label}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {item.bookings} bookings
                    </Text>
                  </div>
                ))}
              {data.performance.top_products_by_revenue
                .slice(0, 2)
                .map((item) => (
                  <div
                    className="flex items-center justify-between"
                    key={`product-${item.label}`}
                  >
                    <Text size="xsmall">{item.label}</Text>
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {asCurrency(item.revenue, data.currency_code)}
                    </Text>
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
              const previousCount =
                index > 0 ? funnel.stages[index - 1].count : stage.count;
              const absoluteLoss = Math.max(previousCount - stage.count, 0);
              const isBiggestDropoff = stage.key === biggestDropoff?.key;
              const severity =
                index === 0
                  ? { color: "green" as const, label: "Normal" }
                  : getSeverity(stage.dropoff_from_previous, 20, 35);

              return (
                <Container className="p-0" key={stage.key}>
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link
                      to={stage.href}
                      className="text-ui-fg-interactive text-small"
                    >
                      {stage.label}
                    </Link>
                    <StatusBadge color={severity.color}>
                      {severity.label}
                    </StatusBadge>
                  </div>
                  <div className="border-t px-4 py-2">
                    <Text size="xsmall" className="text-ui-fg-subtle">
                      {index === 0
                        ? "Entry stage"
                        : `Conversion ${asPercent(stage.conversion_from_previous)} · Drop-off ${asPercent(stage.dropoff_from_previous)} (${absoluteLoss} lost)`}
                    </Text>
                    {isBiggestDropoff ? (
                      <Text size="xsmall" className="text-ui-fg-muted mt-1">
                        Largest bottleneck in funnel.
                      </Text>
                    ) : null}
                  </div>
                </Container>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 px-6 py-4 md:grid-cols-2 xl:grid-cols-4">
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Lead → Booking conversion
            </Text>
            <Heading level="h2">
              {asPercent(funnel.derived_metrics.lead_to_booking_conversion)}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Week{" "}
              {asChangeLabel(
                funnel.period_comparison.week.lead_to_booking_change_percent,
              )}{" "}
              · Month{" "}
              {asChangeLabel(
                funnel.period_comparison.month.lead_to_booking_change_percent,
              )}
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Booking → Paid conversion
            </Text>
            <Heading level="h2">
              {asPercent(funnel.derived_metrics.booking_to_paid_conversion)}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Week{" "}
              {asChangeLabel(
                funnel.period_comparison.week.booking_to_paid_change_percent,
              )}{" "}
              · Month{" "}
              {asChangeLabel(
                funnel.period_comparison.month.booking_to_paid_change_percent,
              )}
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Overall funnel conversion
            </Text>
            <Heading level="h2">
              {asPercent(funnel.derived_metrics.overall_funnel_conversion)}
            </Heading>
            <Text size="xsmall" className="text-ui-fg-muted">
              Paid share of all leads
            </Text>
          </Container>
          <Container className="px-3 py-3">
            <Text size="xsmall" className="text-ui-fg-subtle">
              Average stage velocity
            </Text>
            <Heading level="h2">
              {asHours(funnel.derived_metrics.average_hours_lead_to_booking)} /{" "}
              {asHours(funnel.derived_metrics.average_hours_booking_to_payment)}
            </Heading>
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
                <Text
                  size="small"
                  key={insight.id}
                  className="text-ui-fg-subtle"
                >
                  • {insight.title}: {insight.detail}
                </Text>
              ))}
              {funnel.insights.map((insight) => (
                <Text
                  size="small"
                  key={insight.id}
                  className="text-ui-fg-subtle"
                >
                  • Monitor: {insight.detail}
                </Text>
              ))}
            </div>
          </Container>
        </div>
      </Container>
    </div>
  );
};

export default DashboardPageContent;
