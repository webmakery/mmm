export type HelpArticle = {
  intro: string
  whatIsProduct: string
  whyProductsMatter: string[]
  addProductSteps: string[]
  practicalTips: {
    label: string
    guidance: string
  }[]
  troubleshooting: string[]
}

export type HelpTopic = {
  id: string
  title: string
  patterns: RegExp[]
  helpItems: string[]
  askPrompts: string[]
}

export const productHelpArticle: HelpArticle = {
  intro:
    "Welcome to Help / Ask Webmakerr. This guide gives your team a practical, operations-ready process for creating products correctly the first time.",
  whatIsProduct:
    "In Webhost/Webmakery, a product is the sellable offer in your catalog. It combines customer-facing information (name, description, media, price) with operational data (variants, inventory, category, and publishing status) so sales, fulfillment, and reporting stay aligned.",
  whyProductsMatter: [
    "Products define what customers can discover, evaluate, and purchase in your storefront.",
    "Product setup drives order accuracy by connecting price, inventory, and variant selections to checkout.",
    "Well-structured products improve merchandising, filtering, and collection management in admin.",
    "Consistent product data reduces support issues and improves team handoffs across marketing, operations, and fulfillment.",
  ],
  addProductSteps: [
    "Open Admin → Products, then select Create Product.",
    "Enter a clear title and concise description focused on customer value and key specifications.",
    "Set pricing for each sellable option, then confirm currency and amount before saving.",
    "Upload high-quality images and order them so the first image represents the product best.",
    "Configure variants (for example size or color) so each option has the correct SKU, price, and inventory behavior.",
    "Set inventory quantities and stock handling rules to prevent overselling.",
    "Assign the right category or collection so the product appears in the correct storefront groupings.",
    "Review all details, then publish only after validating title, media, pricing, and inventory.",
  ],
  practicalTips: [
    {
      label: "Title",
      guidance:
        "Use specific, searchable names (brand + model + key attribute) to improve discoverability.",
    },
    {
      label: "Description",
      guidance:
        "Lead with customer benefit, then include materials, dimensions, compatibility, or care details.",
    },
    {
      label: "Price",
      guidance:
        "Keep price structure consistent across variants and verify promotional or compare-at values before publish.",
    },
    {
      label: "Images",
      guidance:
        "Use clean, accurate images and keep variant imagery matched to the exact option customers select.",
    },
    {
      label: "Variants",
      guidance:
        "Create only meaningful options and use clear labels so shoppers understand differences instantly.",
    },
    {
      label: "Inventory",
      guidance:
        "Track stock per variant when possible and confirm replenishment workflow with your operations team.",
    },
    {
      label: "Category / Collection",
      guidance:
        "Map products to the correct category and collection to improve navigation, filtering, and campaigns.",
    },
    {
      label: "Publishing",
      guidance:
        "Publish only after final QA and confirm visibility in the intended sales channels.",
    },
  ],
  troubleshooting: [
    "Product not visible: confirm publish status, sales channel availability, and category/collection assignment.",
    "Wrong price at checkout: verify variant-level pricing and currency configuration.",
    "Customers ordering unavailable options: re-check variant inventory counts and stock rules.",
    "Confusing product page performance: rewrite title/description for clarity and replace low-quality or mismatched images.",
  ],
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
