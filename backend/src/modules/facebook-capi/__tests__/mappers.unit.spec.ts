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
      total: 3000,
      items: [{ variant_id: "variant_1", quantity: 2, unit_price: 1500 }],
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
    expect(event.custom_data?.value).toBe(30)
    expect(event.custom_data?.num_items).toBe(2)
    expect(event.custom_data?.order_id).toBe("order_123")
  })

  it("keeps explicit value payloads unchanged", () => {
    const event = mapToFacebookEvent("purchase", {
      id: "order_987",
      event_id: "evt_987",
      currency_code: "usd",
      value: 30,
      total: 3000,
      items: [{ variant_id: "variant_1", quantity: 1, item_price: 30 }],
    })

    expect(event.custom_data?.value).toBe(30)
    expect(event.custom_data?.contents?.[0]?.item_price).toBe(30)
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

  it("extracts and hashes email from cart payload", () => {
    const event = mapToFacebookEvent("add_to_cart", {
      id: "cart_123",
      event_id: "evt_cart",
      cart: {
        email: "  CartUser@Email.com ",
      },
    })

    expect(event.user_data.em?.[0]).toBe(
      crypto.createHash("sha256").update("cartuser@email.com").digest("hex")
    )
  })

  it("extracts and hashes email from order payload", () => {
    const event = mapToFacebookEvent("purchase", {
      id: "order_123",
      event_id: "evt_order",
      order: {
        email: "  OrderUser@Email.com ",
      },
    })

    expect(event.user_data.em?.[0]).toBe(
      crypto.createHash("sha256").update("orderuser@email.com").digest("hex")
    )
  })

  it("extracts and hashes email from checkout payload", () => {
    const event = mapToFacebookEvent("initiate_checkout", {
      id: "checkout_123",
      event_id: "evt_checkout",
      checkout: {
        email: "  CheckoutUser@Email.com ",
      },
    })

    expect(event.user_data.em?.[0]).toBe(
      crypto.createHash("sha256").update("checkoutuser@email.com").digest("hex")
    )
  })

  it("does not include em when no email source is present", () => {
    const event = mapToFacebookEvent("purchase", {
      id: "order_no_email",
      event_id: "evt_no_email",
      customer_id: "cus_1",
    })

    expect(event.user_data).not.toHaveProperty("em")
  })

  it("extracts and hashes email from order billing address", () => {
    const event = mapToFacebookEvent("purchase", {
      id: "order_billing_email",
      event_id: "evt_billing_email",
      order: {
        billing_address: {
          email: " BillingUser@Email.com ",
        },
      },
    })

    expect(event.user_data.em?.[0]).toBe(
      crypto.createHash("sha256").update("billinguser@email.com").digest("hex")
    )
  })
})
