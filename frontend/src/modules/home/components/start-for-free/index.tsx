import { ArrowRightMini } from "@medusajs/icons"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

import FAQAccordion from "./faq-accordion"

type FeatureCard = {
  eyebrow: string
  title: string
  description: string
  visual: string
}

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
    <section className="relative h-[760px] overflow-hidden border-b border-ui-border-base">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        loop
        muted
        playsInline
        aria-hidden="true"
      >
        <source
          src="https://www.w3schools.com/html/mov_bbb.mp4"
          type="video/mp4"
        />
      </video>

      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      <div className="content-container relative z-10 flex h-full items-center justify-center py-10">
        <div className="w-full max-w-[520px]">
          <div className="rounded-[42px] bg-white px-8 py-8 shadow-[0_24px_60px_rgba(0,0,0,0.24)] small:px-9 small:py-9">
            <h1 className="max-w-[450px] text-[44px] font-semibold leading-[0.96] tracking-[-0.035em] text-ui-fg-base small:text-[56px]">
              Your business starts with Shopify
            </h1>
            <p className="mt-4 max-w-[430px] text-xl font-normal leading-[1.2] text-ui-fg-subtle small:text-[32px] small:leading-[1.14] small:tracking-[-0.01em]">
              Try 3 days free, then 1 €/month for 3 months. What are you waiting
              for?
            </p>
          </div>

          <form
            className="mt-2 rounded-[40px] border border-black/45 bg-[#020810] px-7 py-6 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
            aria-label="Email signup form"
          >
            <h2 className="text-[42px] font-medium leading-[0.96] tracking-[-0.02em] small:text-[50px]">
              Start for free
            </h2>
            <p className="mt-2 text-base-regular text-white/78 small:text-[24px] small:leading-[1.2]">
              You agree to receive marketing emails.
            </p>

            <label htmlFor="hero-email" className="sr-only">
              Enter your email
            </label>
            <div className="mt-5 flex items-center rounded-full border border-white/25 bg-white/[0.06] p-2 pl-6">
              <input
                id="hero-email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-xl text-white outline-none placeholder:text-xl placeholder:text-white/62 small:text-[40px] small:leading-none small:placeholder:text-[40px]"
              />
              <button
                type="submit"
                className="flex size-12 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020810] small:size-[72px]"
                aria-label="Submit email"
              >
                <ArrowRightMini />
              </button>
            </div>
          </form>
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
