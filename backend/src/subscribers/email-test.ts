import { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { INotificationModuleService } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type CustomerCreatedEvent = {
  id: string
  email?: string | null
  first_name?: string | null
  last_name?: string | null
}

export default async function emailTestSubscriber({
  event: { data },
  container,
}: SubscriberArgs<CustomerCreatedEvent>) {
  const notificationModuleService: INotificationModuleService = container.resolve(
    Modules.NOTIFICATION
  )

  const recipient = data.email

  if (!recipient) {
    return
  }

  const customerName = [data.first_name, data.last_name].filter(Boolean).join(" ")

  await notificationModuleService.createNotifications({
    to: recipient,
    channel: "email",
    template: "customer-created",
    data: {
      customer_id: data.id,
      customer_name: customerName,
      customer_email: recipient,
    },
    content: {
      subject: "Welcome to our store",
      text: `Hi ${customerName || "there"}, your customer account was created successfully.`,
      html: `<p>Hi ${customerName || "there"},</p><p>Your customer account was created successfully.</p>`,
    },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
