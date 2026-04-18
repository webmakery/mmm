import { POST } from "../route"

describe("POST /admin/help/ask", () => {
  const originalApiKey = process.env.OPENAI_API_KEY

  afterEach(() => {
    process.env.OPENAI_API_KEY = originalApiKey
    jest.restoreAllMocks()
  })

  it("returns source AI when OpenAI succeeds via output_text", async () => {
    process.env.OPENAI_API_KEY = "test-key"

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const json = jest.fn()

    const req = {
      validatedBody: {
        pathname: "/app/products",
        question: "How do I add a product?",
      },
      scope: {
        resolve: jest.fn().mockReturnValue(logger),
      },
    } as any

    const res = {
      json,
    } as any

    jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: "Use Products > Create, then add options and variants.",
      }),
    } as Response)

    await POST(req, res)

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "AI",
        answer: "Use Products > Create, then add options and variants.",
      })
    )
    expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining("fallback branch used"))
  })

  it("returns source AI when OpenAI succeeds via output content blocks", async () => {
    process.env.OPENAI_API_KEY = "test-key"

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const json = jest.fn()

    const req = {
      validatedBody: {
        pathname: "/app/products",
        question: "How do I add a product?",
      },
      scope: {
        resolve: jest.fn().mockReturnValue(logger),
      },
    } as any

    const res = {
      json,
    } as any

    jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: "output_text",
                text: "Create the product first, then add options and variants.",
              },
            ],
          },
        ],
      }),
    } as Response)

    await POST(req, res)

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "AI",
        answer: "Create the product first, then add options and variants.",
      })
    )
    expect(logger.warn).not.toHaveBeenCalledWith(expect.stringContaining("fallback branch used"))
  })

  it("falls back with missing_openai_api_key when key is absent", async () => {
    delete process.env.OPENAI_API_KEY

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const json = jest.fn()

    const req = {
      validatedBody: {
        pathname: "/app/products",
        question: "How do I add a product?",
      },
      scope: {
        resolve: jest.fn().mockReturnValue(logger),
      },
    } as any

    const res = {
      json,
    } as any

    await POST(req, res)

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ source: "Fallback" }))
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("fallback branch used reason=missing_openai_api_key")
    )
  })

  it("falls back with bad_api_response_shape when output shape is invalid", async () => {
    process.env.OPENAI_API_KEY = "test-key"

    const logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    }

    const json = jest.fn()

    const req = {
      validatedBody: {
        pathname: "/app/products",
        question: "How do I add a product?",
      },
      scope: {
        resolve: jest.fn().mockReturnValue(logger),
      },
    } as any

    const res = {
      json,
    } as any

    jest.spyOn(global, "fetch" as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "resp_123",
      }),
    } as Response)

    await POST(req, res)

    expect(json).toHaveBeenCalledWith(expect.objectContaining({ source: "Fallback" }))
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("reason=bad_api_response_shape"))
  })
})
