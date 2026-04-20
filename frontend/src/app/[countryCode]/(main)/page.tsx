import { Metadata } from "next"

import { Button } from "@medusajs/ui"
import Hero from "@modules/home/components/hero"
import TrackedCtaLink from "@modules/home/components/tracked-cta-link"
import { getStoreBranding } from "@lib/data/store-branding"
import { listRegions } from "@lib/data/regions"

export const metadata: Metadata = {
  title: "Storefront",
  description: "A performant frontend ecommerce storefront.",
}

const trustPoints = [
  "Trusted by teams launching, switching, and scaling",
  "Guided migrations from Shopify and WooCommerce",
  "Transparent plans with no hidden platform surprises",
]

const valueProps = [
  {
    title: "Go live faster",
    description:
      "Launch with a guided setup path, conversion-ready storefront patterns, and support that keeps momentum high.",
  },
  {
    title: "Switch without guesswork",
    description:
      "Migrate catalog, customers, and SEO with a clear checklist, validation steps, and lower go-live risk.",
  },
  {
    title: "Scale with control",
    description:
      "Keep performance and flexibility as your stack grows, without getting boxed into rigid platform limits.",
  },
]

const stageContent = [
  {
    title: "New merchants",
    description:
      "Start strong with guided setup, proven storefront structure, and the essentials to launch confidently.",
    primaryLabel: "Start free",
    primaryHref: "/signup",
    secondaryLabel: "See plans",
    secondaryHref: "/plans",
    location: "stage_new_merchants",
  },
  {
    title: "Shopify / WooCommerce switchers",
    description:
      "Move with less risk through guided migration support, structured validation, and platform-by-platform comparisons.",
    primaryLabel: "Compare Shopify",
    primaryHref: "/compare/shopify",
    secondaryLabel: "Compare WooCommerce",
    secondaryHref: "/compare/woocommerce",
    location: "stage_switchers",
  },
  {
    title: "Scaling brands",
    description:
      "Unlock faster storefront performance, deeper integrations, and workflows built for larger teams.",
    primaryLabel: "Talk to sales",
    primaryHref: "/booking",
    secondaryLabel: "View plans",
    secondaryHref: "/plans",
    location: "stage_scaling_brands",
  },
]

const howItWorks = [
  {
    title: "1. Pick your path",
    description:
      "Choose launch or migration, then align scope, timeline, and technical requirements.",
  },
  {
    title: "2. Set up and validate",
    description:
      "Configure catalog, storefront, checkout, and integrations with guided implementation and pre-launch checks.",
  },
  {
    title: "3. Launch and scale",
    description:
      "Go live with support and keep improving conversion, operations, and performance as you grow.",
  },
]

const testimonials = [
  {
    quote:
      "We moved from Shopify quickly and gained noticeably more control over our storefront experience.",
    byline: "Growth lead, DTC apparel brand",
  },
  {
    quote:
      "The onboarding flow removed a lot of uncertainty for our team and helped us launch with confidence.",
    byline: "Founder, new merchant brand",
  },
]

const faqs = [
  {
    question: "How quickly can we launch?",
    answer:
      "Most teams can launch quickly with the guided path. Timelines depend on catalog size, integrations, and migration complexity.",
  },
  {
    question: "Can you help us migrate from Shopify or WooCommerce?",
    answer:
      "Yes. We support migration planning, data transfer, validation, and go-live support to reduce risk.",
  },
  {
    question: "Will we outgrow this setup?",
    answer:
      "No. The platform supports brands from first launch through larger-scale operations without forcing a replatform.",
  },
  {
    question: "Where can I compare plans before signing up?",
    answer:
      "You can review plan details and pricing on the plans page before starting your signup flow.",
  },
]

type Props = {
  params: Promise<{ countryCode: string }>
}

export default async function Home({ params }: Props) {
  const { countryCode } = await params

  const [branding, regions] = await Promise.all([
    getStoreBranding(),
    listRegions().then((storeRegions) => storeRegions ?? []),
  ])
  return (
    <>
      <Hero storeName={branding.store_name} countryCode={countryCode} regions={regions} />

      <div className="content-container py-10 small:py-12">
        <section className="mb-10 border border-ui-border-base bg-ui-bg-subtle px-4 py-4 small:px-6">
          <p className="mb-3 text-small-plus text-ui-fg-muted">Trusted by ambitious commerce teams</p>
          <ul className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
            {trustPoints.map((point) => (
              <li key={point} className="text-small-semi text-ui-fg-subtle">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-2 text-xl-semi">Why teams choose WebMaker</h2>
          <p className="mb-4 max-w-3xl text-base-regular text-ui-fg-subtle">
            Everything you need to launch quickly, switch safely, and scale confidently.
          </p>
          <ul className="grid gap-4 small:grid-cols-3">
            {valueProps.map((item) => (
              <li
                key={item.title}
                className="border border-ui-border-base bg-ui-bg-subtle p-6"
              >
                <h3 className="mb-2 text-base-semi">{item.title}</h3>
                <p className="text-base-regular text-ui-fg-subtle">
                  {item.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-2 text-xl-semi">Built for your stage</h2>
          <p className="mb-4 max-w-3xl text-base-regular text-ui-fg-subtle">
            Choose the path that matches your business today and the goals you are growing toward.
          </p>
          <ul className="flex flex-col border border-ui-border-base">
            {stageContent.map((item) => (
              <li
                key={item.title}
                className="border-b border-ui-border-base px-4 py-5 small:px-6"
              >
                <h3 className="text-base-semi">{item.title}</h3>
                <p className="mt-1 text-base-regular text-ui-fg-subtle">
                  {item.description}
                </p>
                <div className="mt-4 flex flex-col gap-3 small:flex-row">
                  <Button className="w-full small:w-auto" variant="primary" asChild>
                    <TrackedCtaLink
                      href={item.primaryHref}
                      ctaLocation={item.location}
                      ctaType="primary"
                    >
                      {item.primaryLabel}
                    </TrackedCtaLink>
                  </Button>
                  <Button className="w-full small:w-auto" variant="secondary" asChild>
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

        <section className="mb-10">
          <h2 className="mb-2 text-xl-semi">How it works</h2>
          <p className="mb-4 max-w-3xl text-base-regular text-ui-fg-subtle">
            A simple path from first step to confident launch.
          </p>
          <ul className="grid gap-4 small:grid-cols-3">
            {howItWorks.map((step) => (
              <li key={step.title} className="border border-ui-border-base p-6">
                <h3 className="mb-2 text-base-semi">{step.title}</h3>
                <p className="text-base-regular text-ui-fg-subtle">
                  {step.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-2 text-xl-semi">Teams see results quickly</h2>
          <p className="mb-4 max-w-3xl text-base-regular text-ui-fg-subtle">
            Real feedback from brands that launched or switched with WebMaker.
          </p>
          <ul className="grid gap-4 small:grid-cols-2">
            {testimonials.map((item) => (
              <li key={item.quote} className="border border-ui-border-base bg-ui-bg-subtle p-6">
                <p className="text-base-regular">“{item.quote}”</p>
                <p className="mt-3 text-small-regular text-ui-fg-subtle">
                  {item.byline}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10 border border-ui-border-base p-6">
          <h2 className="mb-2 text-xl-semi">Thinking about switching platforms?</h2>
          <p className="mb-4 text-base-regular text-ui-fg-subtle">
            Compare WebMaker vs Shopify and WooCommerce to review migration paths,
            key differences, and support options side by side.
          </p>
          <div className="flex flex-col gap-3 small:flex-row">
            <Button className="w-full small:w-auto" variant="primary" asChild>
              <TrackedCtaLink
                href="/compare/shopify"
                ctaLocation="comparison_teaser"
                ctaType="primary"
              >
                Compare Shopify
              </TrackedCtaLink>
            </Button>
            <Button className="w-full small:w-auto" variant="secondary" asChild>
              <TrackedCtaLink
                href="/compare/woocommerce"
                ctaLocation="comparison_teaser"
                ctaType="secondary"
              >
                Compare WooCommerce
              </TrackedCtaLink>
            </Button>
          </div>
        </section>

        <section className="mb-10 border border-ui-border-base bg-ui-bg-subtle p-6">
          <h2 className="mb-2 text-xl-semi">Clear pricing, no surprises</h2>
          <p className="mb-4 text-base-regular text-ui-fg-subtle">
            Review plan details upfront and choose the right option for your current stage.
          </p>
          <Button className="w-full small:w-auto" variant="primary" asChild>
            <TrackedCtaLink
              href="/plans"
              ctaLocation="pricing_strip"
              ctaType="primary"
            >
              View plans
            </TrackedCtaLink>
          </Button>
        </section>

        <section className="mb-10">
          <h2 className="mb-2 text-xl-semi">Answers before you commit</h2>
          <p className="mb-4 max-w-3xl text-base-regular text-ui-fg-subtle">
            Get clarity on launch speed, migration, and long-term fit.
          </p>
          <ul className="flex flex-col border border-ui-border-base">
            {faqs.map((item) => (
              <li
                key={item.question}
                className="border-b border-ui-border-base px-4 py-4"
              >
                <h3 className="text-base-semi">{item.question}</h3>
                <p className="mt-1 text-base-regular text-ui-fg-subtle">
                  {item.answer}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section className="border border-ui-border-base p-6">
          <h2 className="mb-2 text-xl-semi">Ready to launch, switch, or scale?</h2>
          <p className="mb-4 text-base-regular text-ui-fg-subtle">
            Start free, review plans, or book a short demo to map your next move with confidence.
          </p>
          <div className="flex flex-col gap-3 small:flex-row">
            <Button className="w-full small:w-auto" variant="primary" asChild>
              <TrackedCtaLink
                href="/signup"
                ctaLocation="final_cta"
                ctaType="primary"
              >
                Start for free
              </TrackedCtaLink>
            </Button>
            <Button className="w-full small:w-auto" variant="secondary" asChild>
              <TrackedCtaLink
                href="/booking"
                ctaLocation="final_cta"
                ctaType="secondary"
              >
                Book a demo
              </TrackedCtaLink>
            </Button>
          </div>
        </section>
      </div>
    </>
  )
}
