import {
  normalizeMessengerWebhookEvent,
  normalizeProviderTimestamp,
  normalizeWhatsAppWebhookEvent,
} from "../meta-normalizers"

describe("inbox meta normalizers", () => {
  it("normalizes messenger timestamps as milliseconds", () => {
    const payload = {
      entry: [
        {
          id: "page_1",
          messaging: [
            {
              sender: { id: "user_1" },
              recipient: { id: "page_1" },
              timestamp: 1718068023000,
              message: { mid: "m_1", text: "hello" },
            },
          ],
        },
      ],
    }

    const result = normalizeMessengerWebhookEvent(payload)

    expect(result.inboundMessages).toHaveLength(1)
    expect(result.inboundMessages[0].timestamp?.toISOString()).toBe("2024-06-11T01:07:03.000Z")
  })

  it("falls back to now when messenger timestamp is missing", () => {
    const payload = {
      entry: [
        {
          id: "page_1",
          messaging: [
            {
              sender: { id: "user_1" },
              recipient: { id: "page_1" },
              message: { mid: "m_1", text: "hello" },
            },
          ],
        },
      ],
    }

    const start = Date.now()
    const result = normalizeMessengerWebhookEvent(payload)
    const end = Date.now()
    const timestamp = result.inboundMessages[0].timestamp

    expect(timestamp).toBeInstanceOf(Date)
    expect(timestamp!.getTime()).toBeGreaterThanOrEqual(start)
    expect(timestamp!.getTime()).toBeLessThanOrEqual(end)
  })

  it("keeps whatsapp timestamps in seconds", () => {
    const payload = {
      entry: [
        {
          changes: [
            {
              value: {
                metadata: { phone_number_id: "123" },
                contacts: [{ wa_id: "15550000000", profile: { name: "Jane" } }],
                messages: [
                  {
                    id: "wamid.1",
                    from: "15550000000",
                    timestamp: "1718068023",
                    text: { body: "hello" },
                  },
                ],
              },
            },
          ],
        },
      ],
    }

    const result = normalizeWhatsAppWebhookEvent(payload)
    expect(result.inboundMessages[0].timestamp?.toISOString()).toBe("2024-06-11T01:07:03.000Z")
  })

  it("returns null for invalid whatsapp timestamp when fallback is disabled", () => {
    expect(normalizeProviderTimestamp("invalid", "s", false)).toBeNull()
  })
})
