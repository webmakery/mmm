import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Shopify style landing",
  description: "Landing page inspired by Shopify homepage layout.",
}

const brandLogos = [
  "FOLKDAYS",
  "GIESSWEIN",
  "Tastillery",
  "MINDY + LOE",
  "BUNDL HOUSE",
  "sushi",
  "GYMSHARK",
  "3Bears",
]

const featureCards = [
  {
    title: "Create a stunning store in seconds",
    description:
      "Pre-built designs make it fast and easy to kickstart your brand.",
    tag: "CUSTOMIZABLE THEMES",
  },
  {
    title: "Sell more with the world's best checkout",
    description:
      "15% higher conversion means you can sell more on Shopify than elsewhere.",
    tag: "OPTIMIZED CHECKOUT",
  },
  {
    title: "Level up with an AI assistant",
    description:
      "Selling is easy with a built-in business partner who can help scale your vision.",
    tag: "NEXT-GEN CX",
  },
  {
    title: "Getting stuff done? Done.",
    description:
      "Shopify handles everything from secure payments to marketing and hardware.",
    tag: "ALL-IN-ONE",
  },
]

const faqs = [
  {
    question: "What is Shopify and how does it work?",
    answer:
      "Shopify is a commerce platform that lets you build a storefront, accept payments, and manage products, orders, and shipping in one place.",
  },
  {
    question: "How much does Shopify cost?",
    answer:
      "Plans vary by needs. You can start with a trial, then choose the plan that matches your business stage.",
  },
  {
    question: "Can I use my own domain name with Shopify?",
    answer:
      "Yes. You can connect an existing domain or buy a new one and manage it directly from your admin.",
  },
  {
    question: "Do I need to be a designer or developer to use Shopify?",
    answer:
      "No. You can launch quickly using ready-made themes and built-in tools, then customize further if needed.",
  },
]

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  await props.params

  return (
    <main className="bg-[#f3f3f3] font-sans text-[#111111]">
      <section className="relative min-h-[860px] overflow-hidden bg-[#cad9ea]">
        <div className="absolute -left-24 top-5 h-72 w-[290px] rotate-[-8deg] rounded-[22px] bg-gradient-to-br from-[#06515c] to-[#0a2231]" />
        <div className="absolute left-[18%] top-[-35px] h-[330px] w-[28%] rotate-[6deg] rounded-[22px] bg-gradient-to-br from-[#93c0da] to-[#76a8cb]" />
        <div className="absolute right-[14%] top-[-15px] h-[220px] w-[25%] rotate-[8deg] rounded-[22px] bg-gradient-to-br from-[#b7805d] to-[#dfba98]" />
        <div className="absolute left-[-2%] top-[41%] h-[320px] w-[36%] rotate-[-9deg] rounded-[22px] bg-gradient-to-br from-[#cca883] to-[#f0dcc4]" />
        <div className="absolute bottom-[17%] right-[6%] h-[275px] w-[31%] rotate-[9deg] rounded-[22px] bg-gradient-to-br from-[#bbc2cd] to-[#e8ebf1]" />
        <div className="absolute bottom-[-76px] left-[35%] h-[300px] w-[25%] rotate-[-11deg] rounded-[22px] bg-gradient-to-br from-[#4f8cc1] to-[#8ec1e8]" />

        <div className="relative mx-auto flex min-h-[860px] max-w-[1140px] items-center justify-center px-6">
          <div className="w-full max-w-[498px] rounded-[28px] bg-white px-10 py-8 shadow-[0_18px_40px_rgba(0,0,0,0.14)]">
            <h1 className="text-[58px] font-medium leading-[0.92] tracking-[-0.03em]">
              Your business starts
              <br />
              with Shopify
            </h1>
            <p className="mt-3 text-[20px] leading-[1.32] text-[#515151]">
              Try 3 days free, then 1 €/month for 3 months.
              <br />
              What are you waiting for?
            </p>

            <div className="mt-7 rounded-[25px] bg-[#02090e] p-5 text-white">
              <p className="text-[38px] font-medium leading-none tracking-[-0.02em]">
                Start for free
              </p>
              <p className="mt-1 text-[11px] text-white/65">
                You agree to receive marketing emails.
              </p>
              <button
                type="button"
                className="mt-4 flex w-full items-center rounded-full border border-white/20 bg-[#13191f] px-5 py-3 text-left"
              >
                <span className="text-[23px] text-white/70">Enter your email</span>
                <span className="ml-auto text-[28px] leading-none">→</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 pb-14 pt-9">
        <div className="mb-14 grid grid-cols-2 gap-y-8 text-center text-[26px] font-medium tracking-[-0.01em] text-[#1f1f1f] sm:grid-cols-4 lg:grid-cols-8">
          {brandLogos.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>

        <div className="grid gap-x-8 gap-y-10 md:grid-cols-2">
          {featureCards.map((feature, idx) => (
            <article key={feature.title}>
              <div className="relative h-[320px] rounded-[17px] bg-[#e7e7e7] p-4">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-semibold tracking-wide text-[#4b4b4b]">
                  {feature.tag}
                </span>
                {idx === 0 && (
                  <div className="mt-10 h-[218px] rounded-[10px] bg-gradient-to-r from-[#dcc2a0] via-[#f4f2ee] to-[#d64d34]" />
                )}
                {idx === 1 && (
                  <div className="mx-auto mt-8 h-[230px] w-[188px] rounded-[40px] border-[8px] border-black bg-white shadow-md" />
                )}
                {idx === 2 && (
                  <div className="mx-auto mt-12 h-[160px] w-[160px] rounded-[26px] bg-white shadow-[0_0_90px_rgba(153,100,255,0.55)]" />
                )}
                {idx === 3 && (
                  <div className="mx-auto mt-9 flex w-[90px] flex-col gap-3">
                    {Array.from({ length: 4 }).map((_, pillIdx) => (
                      <div
                        key={pillIdx}
                        className="h-8 rounded-full bg-white shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
              <h3 className="mt-3 text-[38px] font-medium leading-[1.04] tracking-[-0.025em]">
                {feature.title}
              </h3>
              <p className="mt-2 text-[35px] leading-[1.08] tracking-[-0.02em] text-[#6d6d6d]">
                {feature.description}
              </p>
            </article>
          ))}
        </div>

        <div className="my-16 border-t border-[#dddddd] pt-12">
          <blockquote className="max-w-[980px] text-[56px] font-medium leading-[0.98] tracking-[-0.03em]">
            “We&apos;ve tripled in size since we first started on Shopify. It gives
            us the tools we need to keep pushing forward.”
          </blockquote>
          <p className="mt-3 text-[33px] text-[#757575]">
            Clare Jerome, NEOM Wellbeing
          </p>
        </div>

        <div className="rounded-[18px] bg-[#3f06cc] px-8 py-14 text-center text-white md:px-16">
          <p className="text-[56px] font-medium leading-[0.95] tracking-[-0.03em]">
            No risk, all rewards.
            <br />
            Try Shopify for 1 €/month.
          </p>
          <div className="mx-auto mt-8 flex max-w-[440px] items-center rounded-full bg-white px-5 py-3 text-black">
            <span className="text-[25px] text-[#5a5a5a]">Enter your email</span>
            <span className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black text-2xl text-white">
              →
            </span>
          </div>
          <p className="mt-3 text-[11px] text-white/70">
            You agree to receive Shopify marketing emails.
          </p>
        </div>

        <section className="pb-20 pt-16">
          <h2 className="text-[53px] font-medium leading-none tracking-[-0.03em]">
            Questions?
          </h2>
          <div className="mt-8 border-t border-[#d8d8d8]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group border-b border-[#d8d8d8]">
                <summary className="flex cursor-pointer list-none items-center justify-between py-7">
                  <span className="text-[35px] leading-[1.12] tracking-[-0.02em]">
                    {faq.question}
                  </span>
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-xl text-white transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[980px] pb-6 text-[26px] leading-[1.3] text-[#646464]">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        <footer className="pb-14 pt-2">
          <div className="flex flex-wrap justify-center gap-8 text-[15px] text-[#5b5b5b]">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Sitemap</span>
            <span>Your Privacy Choices</span>
          </div>

          <div className="mx-auto mt-10 max-w-[520px] rounded-[30px] bg-[#05090e] p-5 text-white">
            <p className="text-[38px] font-medium leading-none tracking-[-0.02em]">
              Start for free
            </p>
            <p className="mt-1 text-[11px] text-white/65">
              You agree to receive marketing emails.
            </p>
            <button
              type="button"
              className="mt-4 flex w-full items-center rounded-full border border-white/20 bg-[#13191f] px-5 py-3 text-left"
            >
              <span className="text-[23px] text-white/70">Enter your email</span>
              <span className="ml-auto text-[28px] leading-none">→</span>
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
