import { Metadata } from "next"
import { notFound } from "next/navigation"

import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CompareCtaButtons from "./compare-cta-buttons"

type PlatformKey = "shopify" | "woocommerce"

const platformContent: Record<
  PlatformKey,
  {
    title: string
    subtitle: string
    description: string
    migrationTimeline: Array<{ phase: string; timing: string; detail: string }>
    comparisonRows: Array<{
      capability: string
      webmaker: string
      platform: string
    }>
  }
> = {
  shopify: {
    title: "Switch from Shopify without rebuilding your growth engine",
    subtitle:
      "Migration-ready storefront, predictable pricing, and support from day one.",
    description:
      "Move products, collections, orders, and customers to a storefront built for scale without app lock-in or theme constraints.",
    migrationTimeline: [
      {
        phase: "Discovery",
        timing: "Day 1",
        detail:
          "Audit catalog, storefront requirements, and key Shopify apps before migration starts.",
      },
      {
        phase: "Data migration",
        timing: "Days 2–4",
        detail:
          "Import products, customers, and historical orders while preserving data structure and metadata.",
      },
      {
        phase: "Validation",
        timing: "Days 5–6",
        detail:
          "Run content checks, checkout QA, and SEO redirect validation before launch.",
      },
      {
        phase: "Go-live",
        timing: "Day 7",
        detail:
          "Cut over traffic with launch monitoring and guided post-launch support.",
      },
    ],
    comparisonRows: [
      {
        capability: "Platform flexibility",
        webmaker: "Composable storefront and backend control",
        platform: "Template and app ecosystem constraints",
      },
      {
        capability: "Migration support",
        webmaker: "Guided migration workflow with specialist support",
        platform: "Primarily self-serve",
      },
      {
        capability: "Pricing predictability",
        webmaker: "Transparent plans with growth path",
        platform: "Plan + app costs can stack",
      },
      {
        capability: "Checkout and integrations",
        webmaker: "Open integration strategy and extensible checkout",
        platform: "Depends on app compatibility",
      },
    ],
  },
  woocommerce: {
    title: "Move from WooCommerce to a faster, lower-maintenance stack",
    subtitle:
      "Reduce plugin overhead while keeping your catalog, SEO, and customer data intact.",
    description:
      "Consolidate fragmented plugin workflows into a reliable commerce stack with managed migration support and predictable operations.",
    migrationTimeline: [
      {
        phase: "Planning",
        timing: "Day 1",
        detail:
          "Map WooCommerce plugins, tax/shipping rules, and required integrations.",
      },
      {
        phase: "Transfer",
        timing: "Days 2–4",
        detail:
          "Migrate catalog, customer records, and order history into the new storefront.",
      },
      {
        phase: "Testing",
        timing: "Days 5–6",
        detail:
          "Validate checkout, integrations, and SEO redirects across priority pages.",
      },
      {
        phase: "Launch",
        timing: "Day 7",
        detail: "Deploy with monitored rollout and direct migration support.",
      },
    ],
    comparisonRows: [
      {
        capability: "Operational complexity",
        webmaker: "Unified managed commerce stack",
        platform: "Plugin dependency and compatibility management",
      },
      {
        capability: "Performance",
        webmaker: "Modern storefront defaults with optimized delivery",
        platform: "Performance varies by theme and plugin mix",
      },
      {
        capability: "Security and maintenance",
        webmaker: "Managed platform updates and support",
        platform: "Store owner manages patching and plugin updates",
      },
      {
        capability: "Scale readiness",
        webmaker: "Built to scale with evolving business needs",
        platform: "Scaling often needs extra infrastructure work",
      },
    ],
  },
}

const sharedFaqs = [
  {
    question: "Will migration cause downtime?",
    answer:
      "Most migrations are completed with little to no customer-facing downtime using staged validation and planned cutover windows.",
  },
  {
    question: "How do you protect SEO rankings during migration?",
    answer:
      "We preserve URL structure where possible, map redirects, and validate metadata before launch to protect organic performance.",
  },
  {
    question: "Can I keep my integrations?",
    answer:
      "Yes. We map existing integrations early, then configure native or equivalent integrations during migration.",
  },
  {
    question: "Can I export my data later?",
    answer:
      "Yes. Product, customer, and order data remains portable and can be exported when needed.",
  },
  {
    question: "What support is available after go-live?",
    answer:
      "Your migration includes launch monitoring and post-launch support to stabilize operations and reduce risk.",
  },
]

export async function generateMetadata(props: {
  params: Promise<{ platform: string }>
}): Promise<Metadata> {
  const { platform } = await props.params

  if (platform !== "shopify" && platform !== "woocommerce") {
    return {
      title: "Compare",
    }
  }

  const content = platformContent[platform]

  return {
    title: `Compare: ${content.title}`,
    description: content.subtitle,
  }
}

export function generateStaticParams() {
  return [{ platform: "shopify" }, { platform: "woocommerce" }]
}

export default async function ComparePlatformPage(props: {
  params: Promise<{ platform: string }>
}) {
  const { platform } = await props.params

  if (platform !== "shopify" && platform !== "woocommerce") {
    notFound()
  }

  const content = platformContent[platform]

  return (
    <div className="content-container py-10 small:py-12">
      <section className="mb-10 flex flex-col gap-y-4 border-b border-ui-border-base pb-10">
        <p className="text-small-semi text-ui-fg-subtle">
          Migration comparison
        </p>
        <h1 className="text-2xl-semi">{content.title}</h1>
        <p className="text-base-regular">{content.subtitle}</p>
        <p className="text-base-regular text-ui-fg-subtle">
          {content.description}
        </p>
        <CompareCtaButtons platform={platform} />
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl-semi">How we compare</h2>
        <div className="overflow-x-auto border border-ui-border-base">
          <table className="min-w-full text-left text-small-regular">
            <thead className="border-b border-ui-border-base bg-ui-bg-subtle">
              <tr>
                <th className="px-4 py-3 text-small-semi">Capability</th>
                <th className="px-4 py-3 text-small-semi">WebMaker</th>
                <th className="px-4 py-3 text-small-semi">
                  {platform === "shopify" ? "Shopify" : "WooCommerce"}
                </th>
              </tr>
            </thead>
            <tbody>
              {content.comparisonRows.map((row) => (
                <tr
                  key={row.capability}
                  className="border-b border-ui-border-base"
                >
                  <td className="px-4 py-3 text-small-semi">
                    {row.capability}
                  </td>
                  <td className="px-4 py-3">{row.webmaker}</td>
                  <td className="px-4 py-3 text-ui-fg-subtle">
                    {row.platform}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl-semi">Migration process and timeline</h2>
        <ul className="flex flex-col border border-ui-border-base">
          {content.migrationTimeline.map((step) => (
            <li
              key={step.phase}
              className="flex flex-col gap-2 border-b border-ui-border-base px-4 py-4 small:grid small:grid-cols-[180px_120px_1fr]"
            >
              <p className="text-small-semi">{step.phase}</p>
              <p className="text-small-regular text-ui-fg-subtle">
                {step.timing}
              </p>
              <p className="text-small-regular">{step.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10 border border-ui-border-base bg-ui-bg-subtle p-6">
        <h2 className="mb-2 text-xl-semi">Risk-reversal and trust</h2>
        <p className="text-base-regular">
          Work with a migration specialist, launch with a validated checklist,
          and get direct support through go-live so your team can switch with
          confidence.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl-semi">Migration FAQ</h2>
        <ul className="flex flex-col border border-ui-border-base">
          {sharedFaqs.map((faq) => (
            <li
              key={faq.question}
              className="border-b border-ui-border-base px-4 py-4"
            >
              <h3 className="text-base-semi">{faq.question}</h3>
              <p className="mt-1 text-base-regular text-ui-fg-subtle">
                {faq.answer}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-ui-border-base p-6">
        <h2 className="mb-2 text-xl-semi">Ready to switch?</h2>
        <p className="mb-4 text-base-regular text-ui-fg-subtle">
          Start with a migration trial and launch on a platform that grows with
          your business.
        </p>
        <CompareCtaButtons platform={platform} />
        <p className="mt-4 text-small-regular text-ui-fg-subtle">
          Prefer to compare pricing first?{" "}
          <LocalizedClientLink href="/plans" className="text-ui-fg-base">
            View plans
          </LocalizedClientLink>
          .
        </p>
      </section>
    </div>
  )
}
