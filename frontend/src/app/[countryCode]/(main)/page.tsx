import { Metadata } from "next"

import { Button } from "@medusajs/ui"
import Hero from "@modules/home/components/hero"
import TrackedCtaLink from "@modules/home/components/tracked-cta-link"

export const metadata: Metadata = {
  title: "Storefront",
  description: "A performant frontend ecommerce storefront.",
}

const trustPoints = [
  "Trusted by new and scaling brands",
  "Migration support from Shopify and WooCommerce",
  "Transparent plans with predictable pricing",
]

const valueProps = [
  {
    title: "Launch faster",
    description:
      "Go live in days with a guided setup path, proven storefront patterns, and direct support.",
  },
  {
    title: "Switch with confidence",
    description:
      "Migrate catalog, customers, and SEO carefully with a clear plan and low-risk go-live process.",
  },
  {
    title: "Scale without lock-in",
    description:
      "Keep flexibility as you grow with a commerce stack designed for performance and control.",
  },
]

const stageContent = [
  {
    title: "New merchants",
    description:
      "Start with a clean setup, clear onboarding, and the essentials you need to launch your first store confidently.",
    primaryLabel: "Start for free",
    primaryHref: "/signup",
    secondaryLabel: "See plans",
    secondaryHref: "/plans",
    location: "stage_new_merchants",
  },
  {
    title: "Shopify / WooCommerce switchers",
    description:
      "Move without guesswork using guided migration support, structured validation, and side-by-side comparisons.",
    primaryLabel: "Compare Shopify",
    primaryHref: "/compare/shopify",
    secondaryLabel: "Compare WooCommerce",
    secondaryHref: "/compare/woocommerce",
    location: "stage_switchers",
  },
  {
    title: "Scaling brands",
    description:
      "Reduce platform friction and unlock more control across performance, integrations, and growth workflows.",
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
      "Choose a new launch or migration path, then align on goals, timeline, and technical requirements.",
  },
  {
    title: "2. Launch with confidence",
    description:
      "Set up catalog, storefront, checkout, and integrations with guided implementation and pre-launch checks.",
  },
  {
    title: "3. Grow with support",
    description:
      "Optimize conversion and operations post-launch with a stack built to support long-term scale.",
  },
]

const testimonials = [
  {
    quote:
      "We migrated from Shopify in under two weeks and immediately gained more flexibility across our storefront and operations.",
    byline: "DTC apparel brand, growth team lead",
  },
  {
    quote:
      "The onboarding path made it easy for our team to launch fast without feeling locked into rigid templates.",
    byline: "New merchant, founder",
  },
]

const faqs = [
  {
    question: "How quickly can we launch?",
    answer:
      "Most teams can launch quickly using the guided setup path, with exact timing based on catalog size and integration needs.",
  },
  {
    question: "Can you help us migrate from Shopify or WooCommerce?",
    answer:
      "Yes. We support migration planning, data transfer, validation, and go-live support to reduce risk.",
  },
  {
    question: "Will we outgrow this setup?",
    answer:
      "No. The platform is built to support brands from early launch through scale without forcing a replatform.",
  },
  {
    question: "Where can I compare plans before signing up?",
    answer:
      "You can review plan details and pricing on the plans page before starting your signup flow.",
  },
]

export default function Home() {
  return (
    <>
      <Hero />

      <div className="content-container py-10 small:py-12">
        <section className="mb-10 border border-ui-border-base bg-ui-bg-subtle px-4 py-4 small:px-6">
          <ul className="flex flex-col gap-3 small:flex-row small:items-center small:justify-between">
            {trustPoints.map((point) => (
              <li key={point} className="text-small-semi text-ui-fg-subtle">
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 text-xl-semi">Why brands choose WebMaker</h2>
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
          <h2 className="mb-4 text-xl-semi">Built for your stage</h2>
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
          <h2 className="mb-4 text-xl-semi">How it works</h2>
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
          <h2 className="mb-4 text-xl-semi">What teams say after switching</h2>
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
            Compare WebMaker vs Shopify or WooCommerce to see migration paths,
            feature differences, and support options.
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
          <h2 className="mb-2 text-xl-semi">Simple, transparent pricing</h2>
          <p className="mb-4 text-base-regular text-ui-fg-subtle">
            See plan details up front and choose the right path for where your
            business is today.
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
          <h2 className="mb-4 text-xl-semi">Frequently asked questions</h2>
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
          <h2 className="mb-2 text-xl-semi">Ready to start or switch?</h2>
          <p className="mb-4 text-base-regular text-ui-fg-subtle">
            Start free, review plans, or book a short demo to map your next
            move.
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
