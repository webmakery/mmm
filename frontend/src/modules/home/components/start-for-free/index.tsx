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
  "Für Shopify- & WooCommerce-Shops",
  "3 Tage kostenlos testen",
  "Danach 3 Monate für 1 €/Monat",
  "Ohne Kreditkarte starten",
]

const featureCards: FeatureCard[] = [
  {
    eyebrow: "SCHNELLER START",
    visual: "Storefront-Setup",
    title: "Vom Signup zum verkaufsbereiten Shop mit klaren Schritten",
    description:
      "Geführtes Setup zeigt deinem Team die nächsten Schritte, damit ihr schneller live gehen könnt.",
  },
  {
    eyebrow: "PLANBARE KOSTEN",
    visual: "Preis & Plan",
    title: "Transparenter Einstieg statt versteckter Überraschungen",
    description:
      "3 Tage kostenlos testen, danach 3 Monate für 1 €/Monat.",
  },
  {
    eyebrow: "WECHSEL OHNE CHAOS",
    visual: "Migrations-Checkliste",
    title: "Migration mit Plan statt Risiko",
    description:
      "Produkte, Kund:innen und SEO werden strukturiert übernommen und vor dem Go-live validiert.",
  },
  {
    eyebrow: "WACHSTUM MIT KONTROLLE",
    visual: "Checkout & Kundenkonto",
    title: "Verkaufen, verwalten und ausbauen in einem System",
    description:
      "Sichere Checkouts, Abos, Buchungen und Kundenkonto-Funktionen laufen über eine Plattform.",
  },
]

const faqs = [
  {
    question: "Wie viel Aufwand ist der Start für mein Team?",
    answer:
      "Du legst dein Konto an und folgst einem geführten Setup. Der Prozess ist in klare Schritte aufgeteilt, damit dein Team ohne Technik-Chaos starten kann.",
  },
  {
    question: "Wie sicher ist die Migration von Shopify oder WooCommerce?",
    answer:
      "Die Migration folgt einem festen Ablauf mit Planung, Datenübernahme, Validierung und Go-live-Begleitung.",
  },
  {
    question: "Wie klar ist das Pricing nach dem Test?",
    answer:
      "Du testest 3 Tage kostenlos. Danach zahlst du 3 Monate lang 1 €/Monat. So kannst du mit klaren Kosten entscheiden, ob Webmakerr zu deinem Shop passt.",
  },
  {
    question: "Bekomme ich Hilfe bei Einrichtung und Go-live?",
    answer:
      "Ja. Du bekommst einen geführten Prozess für Setup und Migration inklusive Go-live-Begleitung.",
  },
  {
    question: "Was passiert direkt nach der Anmeldung?",
    answer:
      "Nach dem Signup erstellst du dein Konto, startest den 3-tägigen Test und wirst Schritt für Schritt durch Einrichtung oder Migration geführt.",
  },
  {
    question: "Kann ich mit eigener Domain arbeiten?",
    answer:
      "Ja. Eigene Domains und Domain-Verknüpfungen sind Teil der Plattform und lassen sich im Admin verwalten.",
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
        aria-label="Fixiertes E-Mail-Formular"
      >
        <h2 className="text-xl-semi small:text-2xl-semi">3 Tage kostenlos testen</h2>
        <p className="mt-1 text-small-regular text-white/75">
          Ohne Kreditkarte. Konto in wenigen Minuten erstellt.
        </p>

        <label htmlFor="mobile-sticky-email" className="sr-only">
          E-Mail eingeben
        </label>
        <div className="mt-3 flex items-center rounded-full border border-white/25 bg-white/[0.06] p-1.5 pl-4">
          <input
            id="mobile-sticky-email"
            type="email"
            required
            placeholder="Geschäftliche E-Mail-Adresse"
            className="w-full bg-transparent text-base-regular text-white outline-none placeholder:text-white/62 small:text-large-regular"
          />
          <button
            type="submit"
            className="flex size-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020810]"
            aria-label="Test starten"
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
            <h1 className="max-w-[450px] text-3xl-semi text-ui-fg-base">
              Für wachsende Shops: strukturiert live gehen statt Monate verlieren
            </h1>
            <p className="mt-3 max-w-[430px] text-large-regular text-ui-fg-subtle">
              Für Teams, die neu starten oder von Shopify/WooCommerce wechseln:
              Geführtes Setup, klare Migration und 3 Tage kostenlos testen – ohne
              Kreditkarte. Danach 3 Monate für 1 €/Monat.
            </p>
          </div>

          <form
            className="mt-2 rounded-[40px] border border-black/45 bg-[#020810] px-6 py-5 text-white shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
            aria-label="E-Mail-Formular zum Start"
          >
            <h2 className="text-xl-semi small:text-2xl-semi">Jetzt Testzugang sichern</h2>
            <p className="mt-1 text-small-regular text-white/78">
              Kein Risiko: 3 Tage kostenlos testen. Danach 3 Monate für 1 €/Monat.
            </p>

            <label htmlFor="hero-email" className="sr-only">
              E-Mail eingeben
            </label>
            <div className="email-field-animated-border mt-3 flex items-center p-1.5 pl-4">
              <input
                id="hero-email"
                type="email"
                required
                placeholder="Geschäftliche E-Mail-Adresse"
                className="w-full bg-transparent text-base-regular text-white outline-none placeholder:text-white/62 small:text-large-regular"
              />
              <button
                type="submit"
                className="flex size-10 items-center justify-center rounded-full bg-white text-black transition-colors hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#020810] small:size-12"
                aria-label="Testzugang sichern"
              >
                <ArrowRightMini />
              </button>
            </div>
            <p className="mt-3 text-small-regular text-white/65">
              Wir senden dir nur Infos zur Kontoaktivierung und zum Start.
              Abmeldung jederzeit möglich.
            </p>
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
          „Der Wechsel lief strukturiert, unser Team hatte endlich einen klaren
          Prozess – und wir konnten schneller live gehen als gedacht.“
        </blockquote>
        <p className="mt-6 text-base-regular text-ui-fg-subtle">
          Growth Lead, DTC-Marke
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
            W
          </div>
          <h2 className="mx-auto mt-6 max-w-[560px] text-2xl-semi small:text-3xl-semi">
            Starte jetzt mit klaren Schritten: 3 Tage kostenlos, danach 3 Monate für 1 €/Monat.
          </h2>
          <form
            className="mx-auto mt-7 w-full max-w-[560px]"
            aria-label="E-Mail-Formular für Testzugang"
          >
            <label htmlFor="shopify-promo-email" className="sr-only">
              E-Mail eingeben
            </label>
            <div className="flex items-center rounded-full bg-white p-1.5 pl-5">
              <input
                id="shopify-promo-email"
                type="email"
                required
                placeholder="Geschäftliche E-Mail-Adresse"
                className="w-full bg-transparent text-large-regular text-ui-fg-base outline-none placeholder:text-ui-fg-subtle"
              />
              <button
                type="submit"
                className="flex size-12 items-center justify-center rounded-full bg-black text-white transition-colors hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#4a14d0]"
                aria-label="Jetzt Test starten"
              >
                <ArrowRightMini />
              </button>
            </div>
            <p className="mt-4 text-small-regular text-white/65">
              Wir senden dir nur E-Mails für Kontoaktivierung und Produktstart.
              Du kannst dich jederzeit abmelden.
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}

const StartForFreeLanding = ({ countryCode }: { countryCode?: string }) => {
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
    <main
      className={`bg-ui-bg-subtle ${isHeroVisible ? "" : "pb-44"}`}
      data-country-code={countryCode}
    >
      <HeroCollage heroRef={heroRef} />
      <LogoStrip />
      <FeatureGrid />
      <TestimonialBlock />
      <SecondaryCTA />

      <section className="bg-ui-bg-subtle pb-12 small:pb-16">
        <div className="content-container">
          <h2 className="mb-6 text-xl-semi">Häufige Fragen</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>
      <div ref={footerTriggerRef} aria-hidden="true" />
      <StickyFooterCTA visible={!isHeroVisible && !isFooterVisible} />
    </main>
  )
}

export default StartForFreeLanding
