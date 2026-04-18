export type HelpTopic = {
  id: string
  title: string
  patterns: RegExp[]
  helpItems: string[]
  askPrompts: string[]
}

export const adminHelpTopics: HelpTopic[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    patterns: [/^\/dashboard(?:\/|$)/],
    helpItems: [
      "Check KPI cards first to spot positive or negative trend changes.",
      "Review operational risk indicators to prioritize same-day actions.",
      "Use funnel and trend sections to identify where conversion drops.",
    ],
    askPrompts: [
      "What should I review first on this dashboard?",
      "How do I turn dashboard risks into a task list?",
    ],
  },
  {
    id: "products",
    title: "Products",
    patterns: [/^\/products(?:\/|$)/],
    helpItems: [
      "Use the products list to monitor status, inventory, and pricing consistency.",
      "Open product details to review publishing, sales channels, and metadata.",
      "Keep names, options, and media aligned for easier merchandising.",
    ],
    askPrompts: [
      "How can I clean up my product catalog quickly?",
      "What should I validate before publishing products?",
    ],
  },
  {
    id: "product-edit",
    title: "Add / Edit Product",
    patterns: [/^\/products\/create(?:\/|$)/, /^\/products\/[^/]+(?:\/edit)?(?:\/|$)/],
    helpItems: [
      "Start with title, description, and media before configuring variants.",
      "Confirm price and inventory details for each variant before save.",
      "Use metadata and organization fields to support filtering and operations.",
    ],
    askPrompts: [
      "What fields are most important when creating a product?",
      "How do I avoid mistakes when editing product variants?",
    ],
  },
  {
    id: "orders",
    title: "Orders",
    patterns: [/^\/orders(?:\/|$)/],
    helpItems: [
      "Use order status and payment state to prioritize fulfillment work.",
      "Open order details to verify items, addresses, and fulfillment steps.",
      "Capture internal notes for handoff clarity across support and operations.",
    ],
    askPrompts: [
      "What is the fastest way to triage new orders?",
      "How should I review an order before fulfilling it?",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    patterns: [/^\/settings(?:\/|$)/, /^\/store(?:\/|$)/],
    helpItems: [
      "Review business profile and operational defaults regularly.",
      "Check team roles and permissions to maintain least-privilege access.",
      "Validate integrations after changes to avoid checkout or fulfillment issues.",
    ],
    askPrompts: [
      "Which settings should I audit monthly?",
      "How do I safely roll out admin configuration changes?",
    ],
  },
]

export const findHelpTopicByPath = (pathname: string) => {
  return adminHelpTopics.find((topic) => topic.patterns.some((pattern) => pattern.test(pathname)))
}
