import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { FACEBOOK_CAPI_MODULE } from "../modules/facebook-capi"
import FacebookCapiModuleService from "../modules/facebook-capi/service"

export default async function facebookCapiOrderPlacedHandler({
  event: { data },
  container,
}: SubscriberArgs<Record<string, unknown>>) {
  const facebookCapiService: FacebookCapiModuleService = container.resolve(FACEBOOK_CAPI_MODULE)
  await facebookCapiService.track("purchase", data)
}

export const config: SubscriberConfig = {
  event: ["order.placed", "order.completed"],
}
