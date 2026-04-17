import { Button, Heading, Text } from "@medusajs/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

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
    title: "Create a stunning store in seconds",
    description:
      "Pre-built themes and intuitive controls make it easy to launch quickly.",
    image:
      "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Sell more with the world’s best checkout",
    description:
      "Offer fast payment options and turn more visitors into buyers.",
    image:
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Level up with an AI assistant",
    description:
      "Get built-in help for product copy, campaign ideas, and customer flows.",
    image:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Getting stuff done? Done.",
    description:
      "Run payments, operations, and marketing from one unified platform.",
    image:
      "https://images.unsplash.com/photo-1556742521-9713bf272865?auto=format&fit=crop&w=1200&q=80",
  },
]

const faqs = [
  {
    question: "What is Shopify and how does it work?",
    answer:
      "Shopify is a commerce platform that helps you sell online and in person with one back office.",
  },
  {
    question: "How much does Shopify cost?",
    answer:
      "Try Shopify for 3 days free, then continue with a starter offer before selecting a full plan.",
  },
  {
    question: "Can I use my own domain name with Shopify?",
    answer:
      "Yes. You can connect an existing domain or buy one directly and manage it in your admin.",
  },
  {
    question: "Do I need to be a designer or developer to use Shopify?",
    answer:
      "No. Shopify includes ready-to-use themes and simple tools so you can launch without coding.",
  },
]

const Hero = () => {
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
                alt="Merchant lifestyle"
                className="h-36 w-full object-cover small:h-56"
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-4">
          <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-ui-border-base bg-ui-bg-base p-6 shadow-elevation-card-rest">
            <Heading level="h1" className="text-3xl leading-9">
              Your business starts with Shopify
            </Heading>
            <Text className="mt-3 text-ui-fg-subtle">
              Try 3 days free, then €1/month for 3 months.
            </Text>

            <div className="mt-6 rounded-2xl bg-black p-3">
              <Text className="text-ui-fg-on-color mb-2 text-small-plus">Start for free</Text>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-base px-4 text-small-regular"
                />
                <Button variant="secondary" size="base" asChild>
                  <LocalizedClientLink href="/signup">Start</LocalizedClientLink>
                </Button>
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
            “We've tripled in size since we first started on Shopify. It gives
            us the tools we need to keep pushing forward.”
          </Heading>
          <Text className="mt-3 text-ui-fg-subtle">Clare Jerome, NEOM Wellbeing</Text>
        </blockquote>
      </section>

      <section className="content-container pb-14">
        <div className="mx-auto max-w-4xl rounded-2xl bg-violet-70 px-6 py-12 text-center text-ui-fg-on-color">
          <Text className="text-3xl font-normal leading-10">
            No risk, all rewards.
            <br />
            Try Shopify for €1/month.
          </Text>
          <div className="mx-auto mt-6 flex w-full max-w-md items-center gap-2 rounded-full bg-black p-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-base px-4 text-small-regular text-ui-fg-base"
            />
            <Button variant="secondary" size="base" asChild>
              <LocalizedClientLink href="/signup">→</LocalizedClientLink>
            </Button>
          </div>
        </div>
      </section>

      <section className="content-container pb-14">
        <Heading level="h2" className="text-3xl">
          Questions?
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

      <section className="content-container pb-20">
        <div className="mx-auto max-w-md rounded-2xl border border-ui-border-base bg-black p-4">
          <Text className="text-ui-fg-on-color text-small-plus">Start for free</Text>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="h-10 w-full rounded-full border border-ui-border-base bg-ui-bg-base px-4 text-small-regular"
            />
            <Button variant="secondary" size="base" asChild>
              <LocalizedClientLink href="/signup">→</LocalizedClientLink>
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

export default Hero
