import crypto from "node:crypto"
import { mapToFacebookEvent } from "../mappers"

describe("facebook capi mappers", () => {
  it("maps purchase payload with hashed user data and deterministic event_id", () => {
    const payload = {
      id: "order_123",
      created_at: "2026-01-01T00:00:00.000Z",
      currency_code: "usd",
      email: "Customer@Email.com",
      customer_id: "cus_123",
      total: 150,
      items: [{ variant_id: "variant_1", quantity: 2, unit_price: 75 }],
      context: { ip: "203.0.113.10", user_agent: "jest" },
    }

    const event = mapToFacebookEvent("purchase", payload)

    expect(event.event_name).toBe("Purchase")
    expect(event.event_id).toHaveLength(64)
    expect(event.user_data.em?.[0]).toBe(
      crypto.createHash("sha256").update("customer@email.com").digest("hex")
    )
    expect(event.user_data.external_id?.[0]).toBe(
      crypto.createHash("sha256").update("cus_123").digest("hex")
    )
    expect(event.custom_data?.currency).toBe("USD")
    expect(event.custom_data?.value).toBe(150)
    expect(event.custom_data?.num_items).toBe(2)
    expect(event.custom_data?.order_id).toBe("order_123")
  })

  it("uses explicit event_id when provided", () => {
    const event = mapToFacebookEvent("add_to_cart", {
      id: "cart_1",
      event_id: "evt_abc",
      created_at: "2026-01-01T00:00:00.000Z",
    })

    expect(event.event_id).toBe("evt_abc")
    expect(event.event_name).toBe("AddToCart")
  })
})
