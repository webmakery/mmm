import { Metadata } from "next"

export const metadata: Metadata = {
  title: "CommerceFlow | Grow your business",
  description: "Launch, run, and scale your online business with confidence.",
}

const brandLogos = [
  "FOLKDAYS",
  "GIESSWEIN",
  "TASHLERY",
  "MINDY AND LOE",
  "BUNDL HOUSE",
  "SUSHI BIKES",
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
      "15% higher conversion means you can sell more than elsewhere.",
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
      "CommerceFlow handles everything from secure payments to marketing and hardware.",
    tag: "ALL-IN-ONE",
  },
]

const faqs = [
  "What is CommerceFlow and how does it work?",
  "How much does CommerceFlow cost?",
  "Can I use my own domain name with CommerceFlow?",
  "Do I need to be a designer or developer to use CommerceFlow?",
]

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  await props.params

  return (
    <main className="bg-[#f3f3f3] text-[#0b0b0b]">
      <section className="relative h-[760px] overflow-hidden bg-[#c6d5ea]">
        <div className="absolute -left-20 top-8 h-64 w-72 rotate-[-10deg] rounded-[28px] bg-gradient-to-br from-[#00515b] to-[#0d212d]" />
        <div className="absolute left-[16%] top-[-30px] h-80 w-[28%] rotate-[6deg] rounded-[28px] bg-gradient-to-br from-[#88b8d6] to-[#c3e4fb]" />
        <div className="absolute right-[8%] top-5 h-56 w-[24%] rotate-[8deg] rounded-[28px] bg-gradient-to-br from-[#a86742] to-[#ecc3a3]" />
        <div className="absolute left-[-3%] top-[40%] h-80 w-[35%] rotate-[-9deg] rounded-[28px] bg-gradient-to-br from-[#d2ad85] to-[#efdbbf]" />
        <div className="absolute bottom-[18%] right-[6%] h-72 w-[31%] rotate-[11deg] rounded-[28px] bg-gradient-to-br from-[#d8dbe6] to-[#f5f7fd]" />
        <div className="absolute bottom-[-70px] left-[35%] h-72 w-[26%] rotate-[-12deg] rounded-[28px] bg-gradient-to-br from-[#5ca2d5] to-[#abd1f1]" />

        <div className="relative mx-auto flex h-full max-w-[1120px] items-center justify-center px-6">
          <div className="w-full max-w-[540px] rounded-[30px] bg-white p-8 shadow-[0_16px_45px_rgba(0,0,0,0.18)]">
            <h1 className="text-[52px] font-medium leading-[0.95] tracking-[-0.03em]">
              Your business
              <br />
              starts here.
            </h1>
            <p className="mt-4 text-lg text-[#4f4f4f]">
              Try 3 days free, then $1/month for 3 months. What are you waiting
              for?
            </p>

            <div className="mt-8 rounded-[26px] bg-[#05090e] p-5 text-white">
              <p className="text-[30px] font-medium leading-none">Start for free</p>
              <p className="mt-1 text-xs text-white/60">
                You agree to receive marketing emails.
              </p>
              <div className="mt-4 flex items-center rounded-full border border-white/20 bg-[#141a20] px-5 py-3">
                <span className="text-base text-white/70">Enter your email</span>
                <span className="ml-auto text-2xl leading-none">→</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1120px] px-6 pb-10 pt-8">
        <div className="mb-12 grid grid-cols-2 gap-y-8 text-center text-lg font-medium text-[#222] sm:grid-cols-4 lg:grid-cols-8">
          {brandLogos.map((brand) => (
            <span key={brand}>{brand}</span>
          ))}
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {featureCards.map((feature, idx) => (
            <article key={feature.title}>
              <div className="relative h-[290px] rounded-[20px] bg-[#e8e8e8] p-5">
                <span className="inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-medium tracking-wide text-[#4b4b4b]">
                  {feature.tag}
                </span>
                {idx === 0 && (
                  <div className="mt-12 h-44 rounded-xl bg-gradient-to-r from-[#e4c8a2] via-[#f5f2e8] to-[#d74f37]" />
                )}
                {idx === 1 && (
                  <div className="mx-auto mt-8 h-52 w-48 rounded-[36px] border-[8px] border-black bg-white shadow-lg" />
                )}
                {idx === 2 && (
                  <div className="mx-auto mt-10 h-40 w-40 rounded-[26px] bg-white shadow-[0_0_80px_rgba(136,95,255,0.55)]" />
                )}
                {idx === 3 && (
                  <div className="mx-auto mt-9 flex w-28 flex-col gap-3">
                    {["shop", "items", "card", "visa"].map((pill) => (
                      <div
                        key={pill}
                        className="h-8 rounded-full bg-white shadow-sm"
                      />
                    ))}
                  </div>
                )}
              </div>
              <h3 className="mt-4 text-[34px] font-medium leading-[1.05] tracking-[-0.02em]">
                {feature.title}
              </h3>
              <p className="mt-2 text-xl text-[#666]">{feature.description}</p>
            </article>
          ))}
        </div>

        <div className="my-16 border-t border-[#dddddd] pt-12">
          <blockquote className="max-w-[980px] text-[56px] font-medium leading-[0.98] tracking-[-0.03em]">
            “We&apos;ve tripled in size since we first started on CommerceFlow. It
            gives us the tools we need to keep pushing forward.”
          </blockquote>
          <p className="mt-3 text-2xl text-[#767676]">Clare Jerome, NEOM Wellbeing</p>
        </div>

        <div className="rounded-[20px] bg-[#3f06cc] px-8 py-14 text-center text-white md:px-16">
          <p className="text-[56px] font-medium leading-[0.95] tracking-[-0.03em]">
            No risk, all rewards.
            <br />
            Try for $1/month.
          </p>
          <div className="mx-auto mt-8 flex max-w-[460px] items-center rounded-full bg-white px-5 py-3 text-black">
            <span className="text-lg text-[#555]">Enter your email</span>
            <span className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black text-xl text-white">
              →
            </span>
          </div>
          <p className="mt-3 text-xs text-white/70">
            You agree to receive CommerceFlow marketing emails.
          </p>
        </div>

        <section className="py-20">
          <h2 className="text-[56px] font-medium leading-none tracking-[-0.03em]">
            Questions?
          </h2>
          <ul className="mt-10 border-t border-[#dddddd]">
            {faqs.map((faq) => (
              <li
                key={faq}
                className="flex items-center justify-between border-b border-[#dddddd] py-7"
              >
                <span className="text-[31px] tracking-[-0.02em]">{faq}</span>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-black text-xl text-white">
                  +
                </span>
              </li>
            ))}
          </ul>
        </section>

        <footer className="pb-14 pt-4">
          <div className="flex flex-wrap justify-center gap-8 text-sm text-[#555]">
            <span>Terms of Service</span>
            <span>Privacy Policy</span>
            <span>Sitemap</span>
            <span>Your Privacy Choices</span>
          </div>

          <div className="mx-auto mt-10 max-w-[520px] rounded-[30px] bg-[#05090e] p-5 text-white">
            <p className="text-[30px] font-medium leading-none">Start for free</p>
            <p className="mt-1 text-xs text-white/60">
              You agree to receive marketing emails.
            </p>
            <div className="mt-4 flex items-center rounded-full border border-white/20 bg-[#141a20] px-5 py-3">
              <span className="text-base text-white/70">Enter your email</span>
              <span className="ml-auto text-2xl leading-none">→</span>
            </div>
          </div>
        </footer>
      </section>
    </main>
  )
}
