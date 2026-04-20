"use client"

import { ArrowRightMini } from "@medusajs/icons"
import { RefObject, useEffect, useRef, useState } from "react"

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

const StickyFooterCTA = ({ visible }: { visible: boolean }) => {
  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-opacity duration-200 ${
        visible ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <form
        className="mx-auto w-full max-w-[560px] rounded-[28px] border border-black/45 bg-[#020810] px-4 py-4 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
        aria-label="Sticky email signup form"
      >
        <h2 className="text-xl-semi small:text-2xl-semi">Start for free</h2>
        <p className="mt-1 text-small-regular text-white/75">
          You agree to receive marketing emails.
        </p>

        <label htmlFor="mobile-sticky-email" className="sr-only">
          Enter your email
        </label>
        <div className="mt-3 flex items-center rounded-full border border-white/25 bg-white/[0.06] p-1.5 pl-4">
          <input
            id="mobile-sticky-email"
            type="email"
            required
            placeholder="Enter your email"
            className="w-full bg-transparent text-base-regular text-white outline-none placeholder:text-white/62 small:text-large-regular"
          />
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020810]"
            aria-label="Submit email"
          >
            <ArrowRightMini />
          </button>
        </div>
      </form>
    </div>
  )
}

const HeroCollage = ({ heroRef }: { heroRef: RefObject<HTMLElement | null> }) => {
  return (
    <section
      ref={heroRef}
      className="relative h-[760px] overflow-hidden border-b border-ui-border-base"
    >
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
        <div className="w-full max-w-[477px]">
          <div className="rounded-[42px] bg-white px-7 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.24)] small:px-8 small:py-8">
            <h1 className="max-w-[450px] text-3xl-regular text-ui-fg-base">
              Your business starts with Shopify
            </h1>
            <p className="mt-3 max-w-[430px] text-large-regular text-ui-fg-subtle">
              Try 3 days free, then 1 €/month for 3 months. What are you waiting
              for?
            </p>
          </div>

          <form
            className="mt-2 rounded-[40px] border border-black/45 bg-[#020810] px-6 py-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
            aria-label="Email signup form"
          >
            <h2 className="text-xl-semi small:text-2xl-semi">Start for free</h2>
            <p className="mt-1 text-small-regular text-white/78">
              You agree to receive marketing emails.
            </p>

            <label htmlFor="hero-email" className="sr-only">
              Enter your email
            </label>
            <div className="mt-3 flex items-center rounded-full border border-white/25 bg-white/[0.06] p-1.5 pl-4">
              <input
                id="hero-email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-base-regular text-white outline-none placeholder:text-white/62 small:text-large-regular"
              />
              <button
                type="submit"
                className="flex size-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020810] small:size-12"
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
        <blockquote className="max-w-[860px] text-2xl-semi text-ui-fg-base small:text-3xl-semi">
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
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-white text-3xl-semi text-[#4a14d0]">
            S
          </div>
          <h2 className="mx-auto mt-6 max-w-[560px] text-2xl-semi small:text-3xl-semi">
            No risk, all rewards. Try Shopify for 1 €/month.
          </h2>
          <form
            className="mx-auto mt-7 w-full max-w-[560px]"
            aria-label="Shopify promo email signup form"
          >
            <label htmlFor="shopify-promo-email" className="sr-only">
              Enter your email
            </label>
            <div className="flex items-center rounded-full bg-white p-1.5 pl-5">
              <input
                id="shopify-promo-email"
                type="email"
                required
                placeholder="Enter your email"
                className="w-full bg-transparent text-large-regular text-ui-fg-base outline-none placeholder:text-ui-fg-subtle"
              />
              <button
                type="submit"
                className="flex size-12 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a14d0]"
                aria-label="Submit email"
              >
                <ArrowRightMini />
              </button>
            </div>
            <p className="mt-4 text-small-regular text-white/65">
              You agree to receive Shopify marketing emails.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

const StartForFreeLanding = () => {
  const heroRef = useRef<HTMLElement>(null)
  const footerTriggerRef = useRef<HTMLDivElement>(null)
  const [isHeroVisible, setIsHeroVisible] = useState(true)
  const [isFooterVisible, setIsFooterVisible] = useState(false)

  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting)
      },
      {
        threshold: 0.1,
      }
    )

    observer.observe(hero)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const footerTrigger = footerTriggerRef.current
    if (!footerTrigger) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsFooterVisible(entry.isIntersecting)
    })

    observer.observe(footerTrigger)

    return () => observer.disconnect()
  }, [])

  return (
    <main className={`bg-ui-bg-subtle ${isHeroVisible ? "" : "pb-44"}`}>
      <HeroCollage heroRef={heroRef} />
      <LogoStrip />
      <FeatureGrid />
      <TestimonialBlock />
      <SecondaryCTA />

      <section className="bg-ui-bg-subtle pb-12 small:pb-16">
        <div className="content-container">
          <h2 className="mb-6 text-xl-semi">Questions?</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>
      <div ref={footerTriggerRef} aria-hidden="true" />
      <StickyFooterCTA visible={!isHeroVisible && !isFooterVisible} />
    </main>
  )
}

export default StartForFreeLanding
