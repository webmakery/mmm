import { IMedusaInternalService, LoaderOptions } from "@medusajs/framework/types"
import EmailTemplate from "../models/template"

type DefaultTemplate = {
  key: string
  name: string
  description: string
  subject: string
  html_content: string
  text_content: string
  variables: Record<string, string>
}

const baseHtmlShell = ({
  title,
  preview,
  body,
  footer,
}: {
  title: string
  preview: string
  body: string
  footer: string
}) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f5f7fa;">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;">${preview}</span>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f5f7fa;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px 12px;font-family:Arial,sans-serif;font-size:24px;line-height:32px;font-weight:700;color:#111827;">Webmakerr</td>
            </tr>
            ${body}
            <tr>
              <td style="padding:20px 32px 28px;font-family:Arial,sans-serif;font-size:12px;line-height:18px;color:#6b7280;border-top:1px solid #e5e7eb;">
                ${footer}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

const defaultTemplates: DefaultTemplate[] = [
  {
    key: "welcome-webmakerr",
    name: "Welcome to Webmakerr",
    description: "Warm welcome email for new subscribers and first-time customers.",
    subject: "Welcome to Webmakerr, {{first_name}}",
    html_content: baseHtmlShell({
      title: "Welcome to Webmakerr",
      preview: "Thanks for joining Webmakerr. Here is how to get started.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                Welcome to Webmakerr. We are glad you are here. Our goal is to make it simple for you to discover high-quality products and place orders with confidence.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Explore our latest collections, save your favorites, and check out quickly whenever you are ready.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{shop_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">Start shopping</a>
              </td>
            </tr>`,
      footer:
        'Need help? Reach us anytime at <a href="mailto:{{support_email}}" style="color:#4b5563;text-decoration:underline;">{{support_email}}</a>.',
    }),
    text_content: `Hi {{first_name}},

Welcome to Webmakerr. We are glad you are here.
Explore our latest products and shop whenever you are ready.

Start shopping: {{shop_url}}

Need help? Contact us at {{support_email}}.`,
    variables: {
      first_name: "Customer first name",
      shop_url: "Storefront URL",
      support_email: "Support email address",
    },
  },
  {
    key: "abandoned-cart-reminder",
    name: "You left something in your cart",
    description: "Friendly reminder for customers who left items in their cart.",
    subject: "Your Webmakerr cart is waiting",
    html_content: baseHtmlShell({
      title: "Complete your order",
      preview: "You left items in your cart. Pick up where you left off.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                It looks like you left a few items in your cart at Webmakerr. If you are still interested, your selection is ready whenever you want to continue.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                If you have any questions before checkout, our team is happy to help.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{cart_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">Return to cart</a>
              </td>
            </tr>`,
      footer:
        'You are receiving this email because you started checkout at Webmakerr. Questions? Email <a href="mailto:{{support_email}}" style="color:#4b5563;text-decoration:underline;">{{support_email}}</a>.',
    }),
    text_content: `Hi {{first_name}},

You left items in your Webmakerr cart.
Continue checkout whenever you are ready:
{{cart_url}}

Questions? Contact {{support_email}}.`,
    variables: {
      first_name: "Customer first name",
      cart_url: "Direct URL to the saved cart",
      support_email: "Support email address",
    },
  },
  {
    key: "order-confirmation-thank-you",
    name: "Thanks for your order",
    description: "Order confirmation message with reassurance and next steps.",
    subject: "Order {{order_number}} confirmed",
    html_content: baseHtmlShell({
      title: "Order confirmation",
      preview: "Thanks for your order. We are preparing it now.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                Thank you for your order with Webmakerr. We have received your payment and started preparing your items.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:15px;line-height:23px;color:#111827;">
                <strong>Order number:</strong> {{order_number}}<br />
                <strong>Order total:</strong> {{order_total}}<br />
                <strong>Estimated delivery:</strong> {{estimated_delivery}}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{order_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">View order details</a>
              </td>
            </tr>`,
      footer:
        'We will send tracking details as soon as your package ships. For assistance, contact <a href="mailto:{{support_email}}" style="color:#4b5563;text-decoration:underline;">{{support_email}}</a>.',
    }),
    text_content: `Hi {{first_name}},

Thank you for your order at Webmakerr.
Order number: {{order_number}}
Order total: {{order_total}}
Estimated delivery: {{estimated_delivery}}

View order details: {{order_url}}

Need help? Contact {{support_email}}.`,
    variables: {
      first_name: "Customer first name",
      order_number: "Placed order number",
      order_total: "Order total value",
      estimated_delivery: "Estimated delivery date",
      order_url: "Order details URL",
      support_email: "Support email address",
    },
  },
  {
    key: "promotional-campaign",
    name: "Special offer from Webmakerr",
    description: "Polished campaign template for offers and featured products.",
    subject: "{{offer_title}} at Webmakerr",
    html_content: baseHtmlShell({
      title: "Special offer",
      preview: "Discover this week’s featured picks from Webmakerr.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                We selected a few favorites we think you will love. This week’s feature is <strong>{{offer_title}}</strong>.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Browse curated picks, discover new arrivals, and find products tailored to your style.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{shop_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">Shop featured products</a>
              </td>
            </tr>`,
      footer:
        'You are receiving promotional updates from Webmakerr. <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a> at any time.',
    }),
    text_content: `Hi {{first_name}},

This week’s highlight at Webmakerr: {{offer_title}}.
Browse featured products here: {{shop_url}}

If you no longer want promotional updates, unsubscribe here: {{unsubscribe_url}}.`,
    variables: {
      first_name: "Customer first name",
      offer_title: "Campaign title or highlighted offer",
      shop_url: "Storefront URL",
      unsubscribe_url: "Unsubscribe URL",
    },
  },
  {
    key: "re-engagement-campaign",
    name: "We’d love to see you again",
    description: "Friendly re-engagement template for inactive subscribers.",
    subject: "Still interested in updates from Webmakerr?",
    html_content: baseHtmlShell({
      title: "Welcome back",
      preview: "We miss you. Come back and see what is new.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                It has been a little while, and we wanted to check in. Webmakerr has added new products and useful updates since your last visit.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                If now is not the right time, no problem. You can manage your preferences whenever you like.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{shop_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">See what’s new</a>
              </td>
            </tr>`,
      footer:
        'Prefer fewer emails? Update your settings or <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">unsubscribe here</a>.',
    }),
    text_content: `Hi {{first_name}},

We would love to welcome you back to Webmakerr.
Explore what is new: {{shop_url}}

Prefer fewer emails? Unsubscribe here: {{unsubscribe_url}}.`,
    variables: {
      first_name: "Customer first name",
      shop_url: "Storefront URL",
      unsubscribe_url: "Unsubscribe URL",
    },
  },
  {
    key: "newsletter-update",
    name: "What’s new at Webmakerr",
    description: "Modern newsletter template for updates, highlights, and announcements.",
    subject: "Your Webmakerr update: {{newsletter_highlight}}",
    html_content: baseHtmlShell({
      title: "Newsletter update",
      preview: "Latest highlights, product news, and useful updates from Webmakerr.",
      body: `<tr>
              <td style="padding:8px 32px 0;font-family:Arial,sans-serif;font-size:16px;line-height:24px;color:#111827;">
                Hi {{first_name}},<br /><br />
                Here is your latest update from Webmakerr. This edition includes product highlights, practical tips, and a quick look at what is coming next.
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 0;font-family:Arial,sans-serif;font-size:15px;line-height:23px;color:#111827;">
                <strong>In this issue:</strong><br />
                • {{highlight_one}}<br />
                • {{highlight_two}}<br />
                • {{highlight_three}}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 28px;">
                <a href="{{shop_url}}" style="display:inline-block;padding:12px 20px;background-color:#111827;color:#ffffff;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;line-height:20px;font-weight:600;border-radius:8px;">Read full update</a>
              </td>
            </tr>`,
      footer:
        'You are receiving this newsletter because you subscribed at Webmakerr. <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a> any time.',
    }),
    text_content: `Hi {{first_name}},

Here is your latest Webmakerr update.
- {{highlight_one}}
- {{highlight_two}}
- {{highlight_three}}

Read more: {{shop_url}}

To stop receiving newsletters, unsubscribe here: {{unsubscribe_url}}.`,
    variables: {
      first_name: "Customer first name",
      newsletter_highlight: "Main newsletter headline",
      highlight_one: "First highlight",
      highlight_two: "Second highlight",
      highlight_three: "Third highlight",
      shop_url: "Storefront or newsletter URL",
      unsubscribe_url: "Unsubscribe URL",
    },
  },
]

export default async function seedDefaultEmailTemplates({ container }: LoaderOptions) {
  const templateService: IMedusaInternalService<typeof EmailTemplate> = container.resolve("emailTemplateService")

  const [existingTemplates] = await templateService.listAndCount(
    {},
    {
      select: ["id", "name", "metadata"],
      take: 500,
    }
  )

  const existingDefaultKeys = new Set<string>()
  const existingNames = new Set<string>()

  existingTemplates.forEach((template: any) => {
    if (template.name) {
      existingNames.add(template.name)
    }

    const defaultKey = template.metadata?.default_template_key
    if (typeof defaultKey === "string" && defaultKey.trim()) {
      existingDefaultKeys.add(defaultKey)
    }
  })

  const missingDefaults = defaultTemplates.filter(
    (template) => !existingDefaultKeys.has(template.key) && !existingNames.has(template.name)
  )

  if (!missingDefaults.length) {
    return
  }

  await templateService.create(
    missingDefaults.map((template) => ({
      name: template.name,
      description: template.description,
      subject: template.subject,
      html_content: template.html_content,
      text_content: template.text_content,
      variables: template.variables,
      metadata: {
        default_template_key: template.key,
        is_default_template: true,
      },
    }))
  )
}
