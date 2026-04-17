import { Heading, Text } from "@medusajs/ui"

const collageImages = [
  "https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80",
]

const logos = [
  "POLARAYS",
  "GIESSWEIN",
  "TASHIERY",
  "SUSHI BIKES",
  "GYMSHARK",
  "3BEARS",
]

const featureCards = [
  {
    title: "Im Handumdrehen einen beeindruckenden Onlineshop erstellen",
    description:
      "Mit vorgefertigten Designs kannst du deine Marke schnell und einfach zum Leben erwecken.",
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Dein Abo kann sich selbst finanzieren",
    description:
      "Dank 1 % in Form von Abonnementsgutschriften werden mit Verkäufen Einsparungen generiert.",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Ein KI-Assistent als Boost für dein Business",
    description:
      "Verkaufen wird einfach – mit einem integrierten Business-Partner, der dir hilft, deine Vision zu skalieren.",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Alles im Griff",
    description:
      "Shopify kümmert sich um alles – von sicheren Zahlungen über Marketing bis hin zur Hardware.",
    image:
      "https://images.unsplash.com/photo-1556742521-9713bf272865?auto=format&fit=crop&w=1200&q=80",
  },
]

const faqs = [
  {
    question: "Was ist Shopify und wie funktioniert es?",
    answer:
      "Shopify ist eine Commerce-Plattform, mit der du online und vor Ort mit einer zentralen Verwaltung verkaufen kannst.",
  },
  {
    question: "Was kostet Shopify?",
    answer:
      "Teste Shopify 3 Tage kostenlos und starte danach mit einem vergünstigten Einstiegsangebot.",
  },
  {
    question: "Kann ich meinen eigenen Domain-Namen mit Shopify verwenden?",
    answer:
      "Ja. Du kannst eine bestehende Domain verbinden oder direkt in Shopify eine neue Domain kaufen und verwalten.",
  },
  {
    question: "Muss ich Design- oder Entwicklungskenntnisse haben, um Shopify nutzen zu können?",
    answer:
      "Nein. Shopify bietet einsatzbereite Themes und intuitive Tools, damit du ohne Programmierkenntnisse starten kannst.",
  },
]

const Landing1 = () => {
  return (
    <>
      <section className="relative w-full border-b border-ui-border-base bg-ui-bg-subtle">
        <div className="grid grid-cols-2 gap-4 p-4 small:grid-cols-3 small:p-6">
          {collageImages.map((image, index) => (
            <div
              key={image}
              className={`overflow-hidden rounded-xl ${
                index % 3 === 0 ? "small:col-span-2" : ""
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Shopify Händler"
                className="h-36 w-full object-cover small:h-56"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 shadow-elevation-card-rest">
            <Heading level="h1" className="text-3xl leading-9">
              Dein Business startet mit Shopify
            </Heading>
            <Text className="mt-3 text-ui-fg-subtle">
              Starte kostenlos und baue deinen Shop für 1 $/Monat weiter auf.
              <br />
              Als zusätzliches Plus erhältst du je nach Umsatz bis zu 10.000 $ Gutschriften.
            </Text>

            <div className="mt-6 rounded-2xl bg-black p-3">
              <Text className="text-ui-fg-on-color mb-2 text-small-plus">Kostenlos testen</Text>
              <Text className="mb-2 text-small-regular text-ui-fg-on-color opacity-70">
                Du stimmst zu, Marketing-E-Mails zu erhalten.
              </Text>
              <div className="flex items-center justify-between gap-2 rounded-full border border-ui-border-base bg-ui-bg-base px-4 py-2 text-ui-fg-subtle">
                <span>E-Mail-Adresse eingeben</span>
                <span className="text-ui-fg-base">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="content-container py-10">
        <ul className="grid grid-cols-2 gap-6 text-center text-ui-fg-subtle text-small-plus small:grid-cols-3 large:grid-cols-6">
          {logos.map((logo) => (
            <li key={logo}>{logo}</li>
          ))}
        </ul>
      </section>

      <section className="content-container pb-12">
        <div className="grid grid-cols-1 gap-6 small:grid-cols-2">
          {featureCards.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-ui-border-base bg-ui-bg-subtle p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={feature.image}
                alt={feature.title}
                className="h-52 w-full rounded-xl object-cover"
              />
              <Heading level="h3" className="mt-4 text-large-semi">
                {feature.title}
              </Heading>
              <Text className="mt-1 text-ui-fg-subtle">{feature.description}</Text>
            </article>
          ))}
        </div>
      </section>

      <section className="content-container border-t border-ui-border-base py-14">
        <blockquote className="max-w-4xl">
          <Heading level="h2" className="text-3xl leading-10">
            „Seit wir mit Shopify arbeiten, sind wir auf das Dreifache gewachsen. Shopify hat die Tools,
            die wir brauchen, um voranzukommen.”
          </Heading>
          <Text className="mt-3 text-ui-fg-subtle">Clare Jerome, NEOM Wellbeing</Text>
        </blockquote>
      </section>

      <section className="content-container pb-14">
        <div className="mx-auto max-w-4xl rounded-2xl bg-violet-70 px-6 py-12 text-center text-ui-fg-on-color">
          <Text className="text-3xl font-normal leading-10">
            Kein Risiko, nur Vorteile.
            <br />
            Teste Shopify für 1 $/Monat.
          </Text>
          <Text className="mt-3 text-small-regular text-ui-fg-on-color opacity-90">
            Zusätzlich erhältst du beim Verkaufen Gutschriften in Höhe von bis zu 10.000 $.
          </Text>
          <div className="mx-auto mt-6 flex w-full max-w-md items-center justify-between gap-2 rounded-full bg-black p-2 pl-4 text-ui-fg-subtle">
            <span>E-Mail-Adresse eingeben</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ui-bg-base text-ui-fg-base">
              →
            </span>
          </div>
        </div>
      </section>

      <section className="content-container pb-14">
        <Heading level="h2" className="text-3xl">
          Fragen?
        </Heading>
        <div className="mt-8 border-t border-ui-border-base">
          {faqs.map((faq) => (
            <details key={faq.question} className="group border-b border-ui-border-base py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-base-regular">
                {faq.question}
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-black text-ui-fg-on-color">
                  +
                </span>
              </summary>
              <Text className="mt-4 max-w-3xl text-ui-fg-subtle">{faq.answer}</Text>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}

export default Landing1
