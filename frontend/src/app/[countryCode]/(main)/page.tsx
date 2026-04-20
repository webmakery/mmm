import { Metadata } from "next"

import { ArrowRightMini, BarsThree, ChartBar, RocketLaunch, SparklesMini } from "@medusajs/icons"
import { Badge, Button } from "@medusajs/ui"
import Hero from "@modules/home/components/hero"
import TrackedCtaLink from "@modules/home/components/tracked-cta-link"

export const metadata: Metadata = {
  title: "Storefront",
  description: "A performant frontend ecommerce storefront.",
}

const trustPoints = [
  "Trusted by teams launching, switching, and scaling",
  "Migration support from Shopify & WooCommerce",
  "Transparent plans without platform surprises",
]

const valueProps = [
  {
    title: "Launch with momentum",
    description:
      "Use a proven storefront structure, guided onboarding, and launch support to go live quickly with confidence.",
    icon: RocketLaunch,
  },
  {
    title: "Migrate with less risk",
    description:
      "Move products, customers, orders, and SEO through a structured migration workflow and validation checklist.",
    icon: BarsThree,
  },
  {
    title: "Scale without lock-in",
    description:
      "Grow with flexible integrations, strong storefront performance, and infrastructure that keeps your options open.",
    icon: ChartBar,
  },
]

const stageContent = [
  {
    title: "New merchants",
    description:
      "Start with a clear path from setup to launch, backed by proven conversion-focused storefront patterns.",
    stat: "From zero to live",
    primaryLabel: "Start free",
    primaryHref: "/signup",
    secondaryLabel: "See plans",
    secondaryHref: "/plans",
    location: "stage_new_merchants",
  },
  {
    title: "Shopify / WooCommerce switchers",
    description:
      "Switch platforms with guided migration support, timeline clarity, and pre-launch validation across catalog and SEO.",
    stat: "Lower migration risk",
    primaryLabel: "Compare Shopify",
    primaryHref: "/compare/shopify",
    secondaryLabel: "Compare WooCommerce",
    secondaryHref: "/compare/woocommerce",
    location: "stage_switchers",
  },
  {
    title: "Scaling brands",
    description:
      "Improve performance, unify workflows, and keep strategic control as order volume and team complexity grow.",
    stat: "Built for long-term growth",
    primaryLabel: "Talk to sales",
    primaryHref: "/booking",
    secondaryLabel: "View plans",
    secondaryHref: "/plans",
    location: "stage_scaling_brands",
  },
]

const howItWorks = [
  {
    title: "Plan your path",
    description:
      "Align launch or migration goals, timeline, integrations, and ownership before implementation starts.",
  },
  {
    title: "Build and validate",
    description:
      "Configure storefront, checkout, and data migration with guided execution and quality checks.",
  },
  {
    title: "Launch and optimize",
    description:
      "Go live with support, then improve conversion and operations using performance and growth insights.",
  },
]

const testimonials = [
  {
    quote:
      "We migrated from Shopify and had a cleaner launch process than expected. The team had clear visibility from day one.",
    byline: "Head of ecommerce, multi-brand retailer",
    outcome: "Faster migration execution",
  },
  {
    quote:
      "The onboarding and storefront foundation helped us launch quickly without feeling boxed into a rigid platform setup.",
    byline: "Founder, growth-stage DTC brand",
    outcome: "Confident launch without lock-in",
  },
]

const faqs = [
  {
    question: "How quickly can we launch?",
    answer:
      "Many teams launch in days with guided onboarding. Final timing depends on catalog complexity and required integrations.",
  },
  {
    question: "Can you help us migrate from Shopify or WooCommerce?",
    answer:
      "Yes. We guide planning, data migration, validation, and go-live support to reduce risk and preserve momentum.",
  },
  {
    question: "Will we need to replatform later as we grow?",
    answer:
      "No. The platform is built to support both early-stage and scaling brands without forcing a future rebuild.",
  },
  {
    question: "Where can I compare pricing before signing up?",
    answer:
      "Visit the plans page to review transparent plan details and choose the option that fits your current stage.",
  },
]

export default function Home() {
  return (
    <>
      <Hero />

      <div className="content-container py-12 small:py-16">
        <section className="mb-14 rounded-2xl border border-ui-border-base bg-ui-bg-subtle px-5 py-5 small:px-7">
          <p className="mb-3 text-small-plus text-ui-fg-muted">Trusted by ambitious commerce teams</p>
          <ul className="grid gap-3 text-small-semi text-ui-fg-subtle small:grid-cols-3">
            {trustPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-2xl-semi small:text-3xl-semi">Why teams choose WebMaker</h2>
            <p className="mt-2 max-w-3xl text-base-regular text-ui-fg-subtle">
              A modern commerce foundation built to help you launch faster, migrate with confidence, and scale without compromise.
            </p>
          </div>
          <ul className="grid gap-4 small:grid-cols-3">
            {valueProps.map((item) => {
              const Icon = item.icon

              return (
                <li
                  key={item.title}
                  className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 shadow-elevation-card-rest"
                >
                  <Icon className="mb-4 text-ui-fg-interactive" />
                  <h3 className="mb-2 text-large-semi">{item.title}</h3>
                  <p className="text-base-regular text-ui-fg-subtle">{item.description}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="mb-14 rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
          <div className="mb-8 flex flex-col gap-3 small:flex-row small:items-end small:justify-between">
            <div>
              <h2 className="text-2xl-semi small:text-3xl-semi">How WebMaker works</h2>
              <p className="mt-2 max-w-2xl text-base-regular text-ui-fg-subtle">
                A structured process that removes guesswork from launch and migration.
              </p>
            </div>
            <Button variant="secondary" asChild>
              <TrackedCtaLink href="/booking" ctaLocation="how_it_works" ctaType="secondary">
                Talk to a specialist
              </TrackedCtaLink>
            </Button>
          </div>

          <ul className="grid gap-4 small:grid-cols-3">
            {howItWorks.map((step, index) => (
              <li key={step.title} className="rounded-xl border border-ui-border-base bg-ui-bg-base p-5">
                <p className="mb-3 text-small-plus text-ui-fg-muted">Step {index + 1}</p>
                <h3 className="mb-2 text-base-semi">{step.title}</h3>
                <p className="text-base-regular text-ui-fg-subtle">{step.description}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14">
          <div className="mb-6">
            <h2 className="text-2xl-semi small:text-3xl-semi">Built for your growth stage</h2>
            <p className="mt-2 max-w-3xl text-base-regular text-ui-fg-subtle">
              Whether you are launching a first store, leaving Shopify or WooCommerce, or scaling a mature operation, WebMaker adapts to your next move.
            </p>
          </div>

          <ul className="grid gap-4 small:grid-cols-3">
            {stageContent.map((item) => (
              <li key={item.title} className="rounded-2xl border border-ui-border-base p-6">
                <Badge size="small" color="blue" className="mb-3">
                  {item.stat}
                </Badge>
                <h3 className="text-large-semi">{item.title}</h3>
                <p className="mt-2 text-base-regular text-ui-fg-subtle">{item.description}</p>
                <div className="mt-5 flex flex-col gap-3">
                  <Button className="w-full" variant="primary" asChild>
                    <TrackedCtaLink
                      href={item.primaryHref}
                      ctaLocation={item.location}
                      ctaType="primary"
                    >
                      {item.primaryLabel}
                    </TrackedCtaLink>
                  </Button>
                  <Button className="w-full" variant="secondary" asChild>
                    <TrackedCtaLink
                      href={item.secondaryHref}
                      ctaLocation={item.location}
                      ctaType="secondary"
                    >
                      {item.secondaryLabel}
                    </TrackedCtaLink>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-14 grid gap-4 small:grid-cols-2">
          {testimonials.map((item) => (
            <article
              key={item.quote}
              className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6"
            >
              <Badge size="small" className="mb-3" color="green">
                {item.outcome}
              </Badge>
              <p className="text-base-regular">“{item.quote}”</p>
              <p className="mt-4 text-small-regular text-ui-fg-subtle">{item.byline}</p>
            </article>
          ))}
        </section>

        <section className="mb-14 grid gap-4 small:grid-cols-2">
          <div className="rounded-2xl border border-ui-border-base p-6 small:p-8">
            <h2 className="text-xl-semi">Compare before you switch</h2>
            <p className="mt-2 text-base-regular text-ui-fg-subtle">
              Evaluate WebMaker against Shopify and WooCommerce with side-by-side migration guidance and fit analysis.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <Button className="w-full small:w-auto" variant="primary" asChild>
                <TrackedCtaLink href="/compare/shopify" ctaLocation="comparison_teaser" ctaType="primary">
                  Compare Shopify <ArrowRightMini />
                </TrackedCtaLink>
              </Button>
              <Button className="w-full small:w-auto" variant="secondary" asChild>
                <TrackedCtaLink href="/compare/woocommerce" ctaLocation="comparison_teaser" ctaType="secondary">
                  Compare WooCommerce
                </TrackedCtaLink>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
            <h2 className="text-xl-semi">Clear plans for every stage</h2>
            <p className="mt-2 text-base-regular text-ui-fg-subtle">
              Review transparent monthly plans, understand what is included, and upgrade as your brand grows.
            </p>
            <Button className="mt-5 w-full small:w-auto" variant="primary" asChild>
              <TrackedCtaLink href="/plans" ctaLocation="pricing_teaser" ctaType="primary">
                View plans
              </TrackedCtaLink>
            </Button>
          </div>
        </section>

        <section className="mb-14 rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-6 small:p-8">
          <h2 className="text-2xl-semi">Frequently asked questions</h2>
          <p className="mt-2 max-w-3xl text-base-regular text-ui-fg-subtle">
            Quick answers on launch speed, migration support, and long-term platform fit.
          </p>
          <ul className="mt-6 grid gap-4 small:grid-cols-2">
            {faqs.map((item) => (
              <li key={item.question} className="rounded-xl border border-ui-border-base bg-ui-bg-base p-5">
                <h3 className="text-base-semi">{item.question}</h3>
                <p className="mt-2 text-base-regular text-ui-fg-subtle">{item.answer}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-ui-border-base p-7 small:p-10">
          <Badge size="small" color="blue" className="mb-4">
            <SparklesMini /> Built for long-term ecommerce growth
          </Badge>
          <h2 className="text-2xl-semi small:text-3xl-semi">Ready to launch, switch, or scale with confidence?</h2>
          <p className="mt-3 max-w-3xl text-base-regular text-ui-fg-subtle">
            Start free, review pricing, or book a short strategy call to map the fastest path for your store.
          </p>
          <div className="mt-6 flex flex-col gap-3 small:flex-row">
            <Button className="w-full small:w-auto" variant="primary" asChild>
              <TrackedCtaLink href="/signup" ctaLocation="final_cta" ctaType="primary">
                Start for free
              </TrackedCtaLink>
            </Button>
            <Button className="w-full small:w-auto" variant="secondary" asChild>
              <TrackedCtaLink href="/booking" ctaLocation="final_cta" ctaType="secondary">
                Book a demo
              </TrackedCtaLink>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
