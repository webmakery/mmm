import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { generateInvoicePdfWorkflow } from "../workflows/generate-invoice-pdf"

type EventPayload = {
  id: string
}

export default async function orderPlacedInvoiceHandler({
  event: { data },
  container,
}: SubscriberArgs<EventPayload>) {
  const query = container.resolve("query")

  const notificationModuleService = (() => {
    try {
      return container.resolve("notification")
    } catch {
      return null
    }
  })()

  if (!notificationModuleService) {
    return
  }

  const {
    data: [order],
  } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "total",
      "email",
      "items.*",
      "items.variant.*",
      "items.variant.product.*",
      "shipping_address.*",
      "billing_address.*",
      "shipping_methods.*",
      "tax_total",
      "subtotal",
      "discount_total",
    ],
    filters: {
      id: data.id,
    },
  })

  const {
    result: { pdf_buffer },
  } = await generateInvoicePdfWorkflow(container).run({
    input: {
      order_id: data.id,
    },
  })

  const buffer = Buffer.from(pdf_buffer)
  const binaryString = [...buffer]
    .map((byte) => byte.toString(2).padStart(8, "0"))
    .join("")

  await notificationModuleService.createNotifications({
    to: order.email || "",
    template: "order-placed",
    channel: "email",
    data: order,
    attachments: [
      {
        content: binaryString,
        filename: `invoice-${order.id}.pdf`,
        content_type: "application/pdf",
        disposition: "attachment",
      },
    ],
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
