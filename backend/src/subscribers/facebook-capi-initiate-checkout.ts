import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { FACEBOOK_CAPI_MODULE } from "../modules/facebook-capi"
import FacebookCapiModuleService from "../modules/facebook-capi/service"

const shouldSendInitiateCheckout = (eventName: string, data: Record<string, unknown>) => {
  if (eventName === "cart.checkout_started") {
    return true
  }

  const action = String(data.action || data.type || "")
  return ["checkout_started", "initiate_checkout"].includes(action)
}

export default async function facebookCapiInitiateCheckoutHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  if (!shouldSendInitiateCheckout(event.name, event.data)) {
    return
  }

  const facebookCapiService: FacebookCapiModuleService = container.resolve(FACEBOOK_CAPI_MODULE)
  await facebookCapiService.track("initiate_checkout", event.data)
}

export const config: SubscriberConfig = {
  event: ["cart.checkout_started", "cart.updated"],
}
