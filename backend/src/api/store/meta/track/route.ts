import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { FACEBOOK_CAPI_MODULE } from "../../../../modules/facebook-capi"
import FacebookCapiModuleService from "../../../../modules/facebook-capi/service"

type MetaTrackStorePayload = {
  event_name?: "AddToCart" | "InitiateCheckout" | "AddPaymentInfo" | "Purchase"
  event_id?: string
  event_source_url?: string
  _fbp?: string
  _fbc?: string
  fbp?: string
  fbc?: string
  email?: string
  phone?: string
  external_id?: string
  currency_code?: string
  total?: number
  raw_total?: number
  value?: number
  content_type?: string
  content_ids?: string[]
  contents?: Array<{ id: string; quantity?: number; item_price?: number }>
  num_items?: number
  items?: Array<{ id: string; quantity?: number; item_price?: number }>
}

const mapEventNameToDomainType = (eventName: MetaTrackStorePayload["event_name"]) => {
  switch (eventName) {
    case "AddToCart":
      return "add_to_cart"
    case "InitiateCheckout":
      return "initiate_checkout"
    case "AddPaymentInfo":
      return "add_payment_info"
    case "Purchase":
      return "purchase"
    default:
      return null
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const payload = (req.body || {}) as MetaTrackStorePayload

  if (!payload.event_name || !payload.event_id) {
    return res.status(400).json({
      error: "event_name and event_id are required",
    })
  }

  const eventType = mapEventNameToDomainType(payload.event_name)

  if (!eventType) {
    return res.status(400).json({
      error: `Unsupported event_name: ${payload.event_name}`,
    })
  }

  const facebookCapiService: FacebookCapiModuleService = req.scope.resolve(FACEBOOK_CAPI_MODULE)

  if (process.env.NODE_ENV !== "production") {
    console.debug("[meta/server] received event", {
      event_name: payload.event_name,
      event_id: payload.event_id,
    })
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[meta/server] purchase tracking function invoked", {
      event_name: payload.event_name,
      event_id: payload.event_id,
      source: "storefront",
    })
  }

  if (payload.event_name === "Purchase" && process.env.NODE_ENV !== "production") {
    console.debug("[meta/purchase] backend received forwarded value", {
      event_id: payload.event_id,
      forwarded_value: payload.value,
      raw_medusa_total: payload.raw_total ?? payload.total,
    })
  }

  try {
    const responseBody = await facebookCapiService.track(eventType, {
      ...payload,
      event_id: payload.event_id,
      _fbp: payload._fbp,
      _fbc: payload._fbc,
      currency_code: payload.currency_code,
      total: payload.total,
      raw_total: payload.raw_total ?? payload.total,
      value: payload.value,
      items: payload.items ?? payload.contents,
      context: {
        ip: req.ip,
        user_agent: req.get("user-agent"),
        event_source_url: payload.event_source_url,
      },
    })

    if (process.env.NODE_ENV !== "production") {
      console.debug("[meta/server] meta response body", {
        event_name: payload.event_name,
        event_id: payload.event_id,
        response: responseBody,
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error("[meta/server] failed to forward event", {
      event_name: payload.event_name,
      event_id: payload.event_id,
      error: error instanceof Error ? error.message : "Unknown error",
    })

    // Tracking must never block checkout/cart flows.
    return res.status(200).json({ ok: false })
  }
}
