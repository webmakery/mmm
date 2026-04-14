import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { FACEBOOK_CAPI_MODULE } from "../modules/facebook-capi"
import FacebookCapiModuleService from "../modules/facebook-capi/service"

const shouldSendAddToCart = (eventName: string, data: Record<string, unknown>) => {
  if (eventName === "cart.line_item_added") {
    return true
  }

  const action = String(data.action || data.type || "")
  return ["line_item_added", "add_to_cart"].includes(action)
}

export default async function facebookCapiAddToCartHandler({
  event,
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  if (!shouldSendAddToCart(event.name, event.data)) {
    return
  }

  const facebookCapiService: FacebookCapiModuleService = container.resolve(FACEBOOK_CAPI_MODULE)
  await facebookCapiService.track("add_to_cart", event.data)
}

export const config: SubscriberConfig = {
  event: ["cart.line_item_added", "cart.updated"],
}
