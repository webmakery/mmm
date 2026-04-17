import { Metadata } from "next"

import PlanList from "@modules/subscription/components/plan-list"
import { listSubscriptionPlans } from "@lib/data/subscription-plans"
import { Button } from "@medusajs/ui"

export const metadata: Metadata = {
  title: "Plans",
  description: "Choose a subscription plan.",
}

export default async function PlansPage() {
  const plans = (await listSubscriptionPlans().catch(() => null)) || []
  const faqs = [
    {
      question: "Can I start for free before choosing a paid plan?",
      answer:
        "Yes. You can start for free and move to a paid plan when you are ready to scale your store operations.",
    },
    {
      question: "Can I change my plan later?",
      answer:
        "Absolutely. You can upgrade or downgrade as your business needs evolve, with no long migration process.",
    },
    {
      question: "What payment methods are supported?",
      answer:
        "We support major cards and popular wallet options available in your region through secure checkout.",
    },
    {
      question: "Is there a long-term contract?",
      answer:
        "No mandatory long-term commitment is required for standard subscriptions. You stay flexible as you grow.",
    },
    {
      question: "Does every plan include security and compliance features?",
      answer:
        "Yes. Core security and compliance capabilities are available across plans to help protect customer transactions.",
    },
    {
      question: "Do you provide support during onboarding?",
      answer:
        "Yes. Every customer gets onboarding guidance, and higher-tier plans include faster and more dedicated support.",
    },
    {
      question: "What happens if my business outgrows the current plan?",
      answer:
        "You can move to a higher plan with expanded capabilities and support, so your setup can scale without disruption.",
    },
  ]

  return (
    <div className="w-full bg-ui-bg-base">
      <section className="w-full border-b border-ui-border-base bg-gradient-to-r from-zinc-900 to-zinc-700">
        <div className="content-container py-12 small:py-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-y-6 text-center">
            <p className="text-small-semi uppercase tracking-[0.16em] text-white/80">
              Plans & Pricing
            </p>
            <h1 className="text-3xl-semi text-white small:text-4xl-semi">
              Start for free, then enjoy 1 €/month for 3 months
            </h1>
            <p className="text-base-regular text-white/80">
              Choose the best plan for your business. Change plans as you grow.
            </p>

            <div className="flex w-full max-w-2xl items-center gap-2 rounded-rounded border border-ui-border-base bg-ui-bg-base p-2">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                className="h-10 w-full border-0 bg-transparent px-4 text-base-regular outline-none"
              />
              <Button type="button" variant="primary" className="h-10 px-5">
                Start for free
              </Button>
            </div>

            <p className="text-small-regular text-white/80">
              You agree to receive Shopify marketing emails.
            </p>
          </div>
        </div>
      </section>

      <section className="content-container py-10 small:py-12">
        <PlanList plans={plans} />
      </section>

      <section className="w-full border-t border-ui-border-base bg-ui-bg-subtle">
        <div className="content-container py-10 small:py-12">
          <div className="mx-auto w-full max-w-3xl">
            <h2 className="text-2xl-semi small:text-3xl-semi">Frequently asked questions</h2>
            <p className="mt-2 text-base-regular text-ui-fg-subtle">
              Everything you need to know before selecting your plan.
            </p>

            <ul className="mt-6 space-y-3">
              {faqs.map((faq) => (
                <li
                  key={faq.question}
                  className="rounded-rounded border border-ui-border-base bg-ui-bg-base p-4"
                >
                  <p className="text-base-semi">{faq.question}</p>
                  <p className="mt-2 text-small-regular text-ui-fg-subtle">{faq.answer}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
