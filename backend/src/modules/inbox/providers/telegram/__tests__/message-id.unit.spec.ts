import { buildTelegramExternalMessageId, parseTelegramExternalMessageId } from "../message-id"

describe("telegram message id helpers", () => {
  it("builds scoped ids with chat and message id", () => {
    expect(buildTelegramExternalMessageId("998877", "42")).toBe("998877:42")
  })

  it("parses scoped ids", () => {
    expect(parseTelegramExternalMessageId("998877:42")).toEqual({
      chatId: "998877",
      messageId: "42",
    })
  })

  it("treats unscoped ids as raw message ids", () => {
    expect(parseTelegramExternalMessageId("42")).toEqual({
      chatId: null,
      messageId: "42",
    })
  })
})
