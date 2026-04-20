import { ArrowRightMini } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import FAQAccordion from "./faq-accordion"

type FeatureCard = {
  eyebrow: string
  title: string
  description: string
  visual: string
}

const collageTiles = [
  "from-[#7db9d8] to-[#5f9dc5]",
  "from-[#cdd6df] to-[#e7edf3]",
  "from-[#95a9bb] to-[#7192a8]",
  "from-[#c2d4e5] to-[#a1bdd3]",
  "from-[#d4dee6] to-[#f1f4f8]",
  "from-[#7fa4c0] to-[#527f9e]",
  "from-[#e9eef2] to-[#c8d7e4]",
  "from-[#9eb6c9] to-[#6f95b0]",
]

const logoItems = [
  "allbirds",
  "GYMSHARK",
  "brooklinen",
  "Leesa",
  "KYLIE",
  "Crate&Barrel",
  "MONOS",
]

const featureCards: FeatureCard[] = [
  {
    eyebrow: "CUSTOMIZABLE THEMES",
    visual: "Storefront mockup",
    title: "Create a stunning store in seconds",
    description:
      "Pre-built designs make it fast and easy to kickstart your brand.",
  },
  {
    eyebrow: "GET REWARDED",
    visual: "Revenue chart mockup",
    title: "Your plan can pay for itself",
    description:
      "Turn sales into savings with 1% back as subscription credits.",
  },
  {
    eyebrow: "MEET SIDEKICK",
    visual: "AI assistant mockup",
    title: "Level up with an AI assistant",
    description:
      "Selling is easy with a built-in business partner who can help scale your vision.",
  },
  {
    eyebrow: "ALL-IN-ONE",
    visual: "Payments device mockup",
    title: "Getting stuff done? Done.",
    description:
      "Shopify handles everything from secure payments to marketing and hardware.",
  },
]

const faqs = [
  {
    question: "What is Shopify and how does it work?",
    answer:
      "Shopify is an all-in-one commerce platform to build, run, and grow your business online and in person from one dashboard.",
  },
  {
    question: "How much does Shopify cost?",
    answer:
      "Plans vary by business stage. You can start with a low-cost trial offer and choose a full plan as your business grows.",
  },
  {
    question: "Can I use my own domain name with Shopify?",
    answer:
      "Yes. You can connect an existing domain or purchase a new one and manage it directly in your Shopify admin.",
  },
  {
    question: "Do I need to be a designer or developer to use Shopify?",
    answer:
      "No. Shopify is designed for non-technical users with templates, guided setup, and built-in tools for launching quickly.",
  },
]

const EmailCTA = ({ dark = false }: { dark?: boolean }) => {
  return (
    <form
      className={`mx-auto flex w-full max-w-[580px] flex-col gap-3 rounded-[28px] border p-2 shadow-sm small:flex-row small:items-center ${
        dark
          ? "border-black/20 bg-black text-white"
          : "border-ui-border-base bg-ui-bg-base text-ui-fg-base"
      }`}
      aria-label="Email signup form"
    >
      <div className="px-4 pt-2 small:w-[220px] small:pt-0">
        <p className="text-large-semi">Start for free</p>
        <p
          className={`text-small-regular ${
            dark ? "text-white/70" : "text-ui-fg-subtle"
          }`}
        >
          You agree to receive marketing emails.
        </p>
      </div>

      <label
        htmlFor={dark ? "secondary-email" : "primary-email"}
        className="sr-only"
      >
        Enter your email
      </label>
      <div
        className={`flex flex-1 items-center rounded-full border px-4 py-2 ${
          dark
            ? "border-white/30 bg-transparent"
            : "border-ui-border-base bg-ui-bg-base"
        }`}
      >
        <input
          id={dark ? "secondary-email" : "primary-email"}
          type="email"
          required
          placeholder="Enter your email"
          className={`w-full bg-transparent text-base-regular outline-none placeholder:text-small-regular ${
            dark
              ? "text-white placeholder:text-white/65"
              : "text-ui-fg-base placeholder:text-ui-fg-subtle"
          }`}
        />
        <button
          type="submit"
          className={`flex size-10 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            dark
              ? "bg-white text-black hover:bg-white/90 focus-visible:ring-white focus-visible:ring-offset-[#4a14d0]"
              : "bg-black text-white hover:bg-black/80 focus-visible:ring-black"
          }`}
          aria-label="Submit email"
        >
          <ArrowRightMini />
        </button>
      </div>
    </form>
  )
}

const HeroCollage = () => {
  return (
    <section className="overflow-hidden border-b border-ui-border-base bg-[#d9e8f3] pt-8 small:pt-10">
      <div className="content-container relative pb-10 small:pb-14">
        <div className="pointer-events-none absolute inset-x-6 top-0 grid grid-cols-4 gap-3 small:grid-cols-8">
          {collageTiles.map((tile, index) => (
            <div
              key={tile + index}
              className={`h-[92px] rounded-3xl border border-white/70 bg-gradient-to-br ${tile} shadow-[0_10px_28px_rgba(43,71,96,0.16)] ${
                index % 2 === 0 ? "translate-y-0" : "translate-y-5"
              }`}
            />
          ))}
        </div>

        <div className="relative z-10 mx-auto flex max-w-[860px] flex-col items-center pt-14 small:pt-16">
          <div className="w-full max-w-[520px] rounded-[34px] bg-white px-8 py-7 text-center shadow-[0_30px_70px_rgba(31,58,90,0.2)]">
            <p className="mb-5 text-small-semi uppercase tracking-[0.14em] text-ui-fg-subtle">
              shopify
            </p>
            <h1 className="text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] text-ui-fg-base small:text-[52px]">
              Your business starts with Shopify
            </h1>
            <p className="mx-auto mt-4 max-w-[440px] text-base-regular text-ui-fg-subtle">
              Start for free, keep building for $1/month. Plus, earn up to
              $10,000 in credits as you sell.
            </p>
          </div>

          <div className="mt-[-20px] w-full max-w-[640px] small:mt-[-26px]">
            <EmailCTA />
          </div>
        </div>
      </div>
    </section>
  )
}

const LogoStrip = () => {
  return (
    <section className="border-b border-ui-border-base bg-ui-bg-base">
      <div className="content-container py-8">
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-large-semi text-black/85 small:gap-x-10">
          {logoItems.map((logo) => (
            <li key={logo} className="tracking-tight">
              {logo}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

const FeatureGrid = () => {
  return (
    <section className="bg-ui-bg-subtle py-12 small:py-16">
      <div className="content-container grid gap-5 small:grid-cols-2">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[24px] border border-ui-border-base bg-ui-bg-base p-4"
          >
            <div className="rounded-[20px] border border-ui-border-base bg-ui-bg-subtle p-5">
              <span className="inline-flex rounded-full border border-ui-border-base bg-ui-bg-base px-3 py-1 text-xsmall-regular text-ui-fg-subtle">
                {card.eyebrow}
              </span>
              <div className="mt-4 flex h-44 items-center justify-center rounded-2xl bg-gradient-to-br from-[#f4f4f8] to-[#e4e7ef] text-base-semi text-ui-fg-subtle">
                {card.visual}
              </div>
            </div>
            <h3 className="mt-5 text-xl-semi leading-9">{card.title}</h3>
            <p className="mt-1 text-base-regular text-ui-fg-subtle">
              {card.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

const TestimonialBlock = () => {
  return (
    <section className="bg-ui-bg-subtle py-12 small:py-16">
      <div className="content-container border-t border-ui-border-base pt-12">
        <blockquote className="max-w-[860px] text-[38px] font-semibold leading-[1.1] tracking-[-0.02em] text-ui-fg-base small:text-[54px]">
          “We&apos;ve tripled in size since we first started on Shopify. It
          gives us the tools we need to keep pushing forward.”
        </blockquote>
        <p className="mt-6 text-base-regular text-ui-fg-subtle">
          Clare Jerome, NEOM Wellbeing
        </p>
      </div>
    </section>
  )
}

const SecondaryCTA = () => {
  return (
    <section className="bg-ui-bg-subtle py-4 pb-12 small:pb-16">
      <div className="content-container">
        <div className="mx-auto max-w-[980px] rounded-[28px] bg-[#4a14d0] px-6 py-10 text-center text-white shadow-[0_24px_60px_rgba(74,20,208,0.35)] small:px-10 small:py-12">
          <p className="text-small-semi uppercase tracking-[0.14em] text-white/80">
            shopify
          </p>
          <h2 className="mx-auto mt-4 max-w-[560px] text-[34px] font-semibold leading-[1.08] tracking-[-0.02em] small:text-[48px]">
            No risk, all rewards. Try Shopify for $1/month.
          </h2>
          <p className="mx-auto mt-3 max-w-[500px] text-base-regular text-white/80">
            Plus, earn up to $10,000 in credits as you sell.
          </p>
          <div className="mx-auto mt-7 max-w-[620px]">
            <EmailCTA dark />
          </div>
        </div>
      </div>
    </section>
  )
}

const Footer = () => {
  return (
    <footer className="bg-ui-bg-subtle py-12">
      <div className="content-container flex flex-col items-center justify-between gap-6 border-t border-ui-border-base pt-8 text-small-regular text-ui-fg-subtle small:flex-row">
        <div className="rounded-md border border-ui-border-base px-2 py-1 text-small-semi text-ui-fg-base">
          S
        </div>
        <nav aria-label="Footer links">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
            <li>
              <LocalizedClientLink
                href="/terms-of-service"
                className="transition-colors hover:text-ui-fg-base focus-visible:outline-none focus-visible:underline"
              >
                Terms of Service
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/privacy-policy"
                className="transition-colors hover:text-ui-fg-base focus-visible:outline-none focus-visible:underline"
              >
                Privacy Policy
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/sitemap"
                className="transition-colors hover:text-ui-fg-base focus-visible:outline-none focus-visible:underline"
              >
                Sitemap
              </LocalizedClientLink>
            </li>
            <li>
              <LocalizedClientLink
                href="/privacy-choices"
                className="transition-colors hover:text-ui-fg-base focus-visible:outline-none focus-visible:underline"
              >
                Your Privacy Choices
              </LocalizedClientLink>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  )
}

const StartForFreeLanding = () => {
  return (
    <main className="bg-ui-bg-subtle">
      <HeroCollage />
      <LogoStrip />
      <FeatureGrid />
      <TestimonialBlock />
      <SecondaryCTA />

      <section className="bg-ui-bg-subtle pb-12 small:pb-16">
        <div className="content-container">
          <h2 className="mb-6 text-3xl-semi">Questions?</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <Footer />
    </main>
  )
}

export default StartForFreeLanding
