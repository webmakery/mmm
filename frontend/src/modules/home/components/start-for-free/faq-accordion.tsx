"use client"

import { PlusMini } from "@medusajs/icons"
import { useState } from "react"

type FAQItem = {
  question: string
  answer: string
}

type FAQAccordionProps = {
  items: FAQItem[]
}

const FAQAccordion = ({ items }: FAQAccordionProps) => {
  const [openItem, setOpenItem] = useState<string | null>(null)

  return (
    <ul className="border-y border-ui-border-base">
      {items.map((item) => {
        const isOpen = openItem === item.question

        return (
          <li
            key={item.question}
            className="border-b border-ui-border-base last:border-b-0"
          >
            <button
              type="button"
              className="group flex w-full items-center justify-between gap-4 px-0 py-5 text-left transition-colors hover:text-ui-fg-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-fg-base focus-visible:ring-offset-2"
              onClick={() => setOpenItem(isOpen ? null : item.question)}
              aria-expanded={isOpen}
            >
              <span className="text-base-semi">{item.question}</span>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-ui-border-base bg-ui-bg-base transition-colors group-hover:border-ui-fg-base group-hover:bg-ui-bg-subtle">
                <PlusMini
                  className={`transition-transform duration-300 ${
                    isOpen ? "rotate-45" : "rotate-0"
                  }`}
                />
              </span>
            </button>

            <div
              className={`grid overflow-hidden transition-all duration-300 ease-out ${
                isOpen ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 pr-12">
                <p className="text-base-regular text-ui-fg-subtle">
                  {item.answer}
                </p>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

export default FAQAccordion
