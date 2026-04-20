import { CheckCircleMiniSolid } from "@medusajs/icons"
import { Badge, Button, Heading } from "@medusajs/ui"
import TrackedCtaLink from "@modules/home/components/tracked-cta-link"

const migrationSignals = [
  "Launch in days, not months",
  "Guided Shopify & WooCommerce migration",
  "Scale without platform lock-in",
]

const Hero = () => {
  return (
    <section className="border-b border-ui-border-base bg-gradient-to-b from-ui-bg-base to-ui-bg-subtle">
      <div className="content-container py-12 small:py-16">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="flex flex-col gap-6">
            <Badge className="w-fit" size="small" color="blue">
              Commerce growth platform
            </Badge>

            <div className="space-y-4">
              <Heading level="h1" className="text-3xl leading-tight small:text-5xl">
                Launch faster, migrate safely, and scale without rebuilding later
              </Heading>
              <p className="max-w-2xl text-base-regular text-ui-fg-subtle small:text-large-regular">
                WebMaker helps ambitious merchants go live quickly, switch from
                Shopify or WooCommerce with less risk, and grow on a flexible
                stack designed for long-term performance.
              </p>
            </div>

            <div className="flex flex-col gap-3 small:flex-row">
              <Button className="w-full small:w-auto" variant="primary" asChild>
                <TrackedCtaLink
                  href="/signup"
                  ctaLocation="hero"
                  ctaType="primary"
                >
                  Start for free
                </TrackedCtaLink>
              </Button>
              <Button className="w-full small:w-auto" variant="secondary" asChild>
                <TrackedCtaLink href="/booking" ctaLocation="hero" ctaType="secondary">
                  Book a demo
                </TrackedCtaLink>
              </Button>
            </div>

            <ul className="grid gap-2 text-small-regular text-ui-fg-subtle small:grid-cols-3">
              {migrationSignals.map((signal) => (
                <li key={signal} className="flex items-center gap-2">
                  <CheckCircleMiniSolid className="text-ui-fg-interactive" />
                  <span>{signal}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-ui-border-base bg-ui-bg-base p-4 shadow-elevation-card-rest small:p-6">
            <div className="mb-4 rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
              <p className="text-small-semi text-ui-fg-base">Migration control center</p>
              <p className="mt-1 text-small-regular text-ui-fg-subtle">
                Track launch progress, migration readiness, and growth milestones in one place.
              </p>
            </div>

            <div className="grid gap-3 small:grid-cols-2">
              <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                <p className="text-small-regular text-ui-fg-subtle">Time to launch</p>
                <p className="mt-1 text-xl-semi">7-14 days</p>
                <p className="mt-1 text-small-regular text-ui-fg-muted">Typical for guided onboarding</p>
              </div>
              <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4">
                <p className="text-small-regular text-ui-fg-subtle">Migration confidence</p>
                <p className="mt-1 text-xl-semi">Low-risk rollout</p>
                <p className="mt-1 text-small-regular text-ui-fg-muted">Validated data and SEO checks</p>
              </div>
              <div className="rounded-xl border border-ui-border-base bg-ui-bg-subtle p-4 small:col-span-2">
                <p className="text-small-regular text-ui-fg-subtle">Designed for scaling teams</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-ui-border-base px-3 py-1 text-small-regular">
                    Open integrations
                  </span>
                  <span className="rounded-full border border-ui-border-base px-3 py-1 text-small-regular">
                    Performance-focused storefronts
                  </span>
                  <span className="rounded-full border border-ui-border-base px-3 py-1 text-small-regular">
                    Predictable plans
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
