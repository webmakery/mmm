export type HelpRouteContext = {
  id: string
  title: string
  patterns: RegExp[]
  intro: string
  suggestedQuestions: string[]
  fallbackTips: string[]
}

export const adminHelpContexts: HelpRouteContext[] = [
  {
    id: "products",
    title: "Products",
    patterns: [/^\/products(?:\/|$)/],
    intro:
      "You are in Products. I can help with catalog structure, variants, pricing, inventory, media, categories, and publishing checks.",
    suggestedQuestions: [
      "How do I add a product?",
      "What is a product?",
      "How do variants work?",
      "Why is my product not visible?",
    ],
    fallbackTips: [
      "Create the product basics first (title, description, status), then add media and organization fields.",
      "Add options before variants so each variant has a complete option combination and price.",
      "Verify sales channels, product status, and inventory quantities when a product is not visible.",
    ],
  },
  {
    id: "orders",
    title: "Orders",
    patterns: [/^\/orders(?:\/|$)/],
    intro:
      "You are in Orders. I can help you prioritize fulfillment, payment follow-ups, and customer communication.",
    suggestedQuestions: [
      "How should I triage new orders quickly?",
      "What should I verify before fulfillment?",
      "How do I handle unpaid orders?",
    ],
    fallbackTips: [
      "Start with payment and fulfillment status to prioritize urgent actions.",
      "Review line items, shipping address, and notes before creating fulfillment.",
      "For unpaid orders, confirm payment state and send a clear recovery follow-up.",
    ],
  },
  {
    id: "customers",
    title: "Customers",
    patterns: [/^\/customers(?:\/|$)/],
    intro:
      "You are in Customers. I can help with profile reviews, order history interpretation, and support workflows.",
    suggestedQuestions: [
      "How do I review a customer account effectively?",
      "What customer details should support verify first?",
      "How can I prepare faster customer follow-ups?",
    ],
    fallbackTips: [
      "Check contact details and recent orders first to ground your support response.",
      "Use customer notes to preserve context between team members.",
      "Confirm refund and fulfillment state before committing timelines.",
    ],
  },
  {
    id: "settings",
    title: "Settings",
    patterns: [/^\/settings(?:\/|$)/, /^\/store(?:\/|$)/],
    intro:
      "You are in Settings. I can help with configuration checks, safe rollout practices, and role-based access.",
    suggestedQuestions: [
      "Which settings should I audit monthly?",
      "How can I roll out settings changes safely?",
      "How should I manage admin roles and permissions?",
    ],
    fallbackTips: [
      "Apply one configuration change at a time and verify its effect immediately.",
      "Review permissions with least-privilege access in mind.",
      "Re-check integrations after credential or endpoint changes.",
    ],
  },
  {
    id: "dashboard",
    title: "Dashboard",
    patterns: [/^\/dashboard(?:\/|$)/],
    intro:
      "You are in Dashboard. I can help interpret KPIs, identify risks, and turn trends into next actions.",
    suggestedQuestions: [
      "What should I review first on this dashboard?",
      "How can I turn dashboard trends into action items?",
      "Which risks should I handle today?",
    ],
    fallbackTips: [
      "Check trend direction first, then focus on operational risk indicators.",
      "Prioritize action items tied to conversion or revenue-impact metrics.",
      "Use date ranges consistently when comparing KPI performance.",
    ],
  },
]

export const defaultAdminHelpContext: HelpRouteContext = {
  id: "general",
  title: "Admin",
  patterns: [],
  intro:
    "You are in the admin panel. Ask what this screen is for, what to do next, or how to complete the current task safely.",
  suggestedQuestions: [
    "What is this page used for?",
    "What should I do first on this screen?",
    "How can I avoid mistakes here?",
  ],
  fallbackTips: [
    "Start with required fields and status settings before optional configuration.",
    "Save in small steps and validate visible outcomes after each change.",
    "Keep a short checklist for repeatable admin operations.",
  ],
}

export const findHelpContextByPath = (pathname: string) =>
  adminHelpContexts.find((topic) => topic.patterns.some((pattern) => pattern.test(pathname))) ||
  defaultAdminHelpContext
