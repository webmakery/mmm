import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { findHelpContextByPath } from "../../../../admin/lib/admin-help-context"

export const PostAdminHelpAskSchema = z.object({
  pathname: z.string().min(1),
  question: z.string().min(1),
})

type PostAdminHelpAskBody = z.infer<typeof PostAdminHelpAskSchema>

type HelpAskResponse = {
  answer: string
  source: "AI" | "Fallback"
  suggestions: string[]
  context_title: string
}

const createFallbackAnswer = (pathname: string, question: string) => {
  const context = findHelpContextByPath(pathname)
  const normalizedQuestion = question.toLowerCase()

  if (context.id === "products") {
    if (normalizedQuestion.includes("what is a product")) {
      return "A product is the sellable catalog record that holds core information (title, description, status, media, organization) and its sellable variant combinations. Variants carry price, SKU, and inventory behavior used at checkout."
    }

    if (normalizedQuestion.includes("add a product")) {
      return "To add a product: 1) Create the basic product record with title, description, and status. 2) Add media and product organization details. 3) Define options (like size or color). 4) Create variants with prices and SKUs. 5) Set inventory and sales channels. 6) Review visibility and publish."
    }

    if (normalizedQuestion.includes("variant")) {
      return "Variants represent the purchasable combinations of product options. Define options first, then create each valid combination with its own price, SKU, and inventory rules."
    }

    if (normalizedQuestion.includes("not visible") || normalizedQuestion.includes("visible")) {
      return "If a product is not visible, check product status, assigned sales channels, publish state, and whether required variant pricing and inventory are configured."
    }
  }

  return `${context.intro} ${context.fallbackTips.join(" ")}`
}

const createSystemPrompt = (contextTitle: string, intro: string, tips: string[]) => {
  return [
    "You are Webmakerr admin assistant. Respond with concise, professional guidance.",
    "Be accurate, practical, and avoid filler.",
    "When useful, give clear numbered steps.",
    `Current admin area: ${contextTitle}.`,
    `Area context: ${intro}`,
    `Fallback guidance anchors: ${tips.join(" ")}`,
  ].join("\n")
}

type HelpAskFailureReason =
  | "missing_openai_api_key"
  | "request_error"
  | "bad_api_response_shape"
  | "empty_model_output"
  | "parsing_failure"

type QueryOpenAiResult = {
  answer: string | null
  failureReason?: HelpAskFailureReason
  details?: string
}

const extractResponseText = (payload: unknown): QueryOpenAiResult => {
  if (!payload || typeof payload !== "object") {
    return {
      answer: null,
      failureReason: "bad_api_response_shape",
      details: "payload_not_object",
    }
  }

  const typedPayload = payload as Record<string, unknown>

  const outputText = typedPayload.output_text
  if (typeof outputText === "string") {
    const trimmedOutputText = outputText.trim()

    if (trimmedOutputText) {
      return { answer: trimmedOutputText }
    }

    return {
      answer: null,
      failureReason: "empty_model_output",
      details: "output_text_empty",
    }
  }

  const output = typedPayload.output
  if (!Array.isArray(output)) {
    return {
      answer: null,
      failureReason: "bad_api_response_shape",
      details: "missing_output_array",
    }
  }

  const textChunks: string[] = []

  for (const item of output) {
    if (!item || typeof item !== "object") {
      continue
    }

    const itemContent = (item as { content?: unknown }).content
    if (!Array.isArray(itemContent)) {
      continue
    }

    for (const contentItem of itemContent) {
      if (!contentItem || typeof contentItem !== "object") {
        continue
      }

      const text = (contentItem as { text?: unknown }).text
      if (typeof text === "string") {
        const trimmedText = text.trim()
        if (trimmedText) {
          textChunks.push(trimmedText)
        }
      }
    }
  }

  if (textChunks.length === 0) {
    return {
      answer: null,
      failureReason: "empty_model_output",
      details: "output_content_without_text",
    }
  }

  return {
    answer: textChunks.join("\n\n"),
  }
}

const queryOpenAi = async (
  contextTitle: string,
  pathname: string,
  question: string
): Promise<QueryOpenAiResult> => {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  const hasApiKey = Boolean(apiKey)
  const model = process.env.OPENAI_HELP_MODEL?.trim() || "gpt-4.1-mini"

  if (!hasApiKey) {
    return {
      answer: null,
      failureReason: "missing_openai_api_key",
      details: "OPENAI_API_KEY missing or empty",
    }
  }

  const context = findHelpContextByPath(pathname)

  let response: Response

  try {
    response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: "system",
            content: createSystemPrompt(contextTitle, context.intro, context.fallbackTips),
          },
          {
            role: "user",
            content: `Pathname: ${pathname}\nQuestion: ${question}`,
          },
        ],
        temperature: 0.3,
        max_output_tokens: 280,
      }),
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      answer: null,
      failureReason: "request_error",
      details: `request_exception=${errorMessage}`,
    }
  }

  if (!response.ok) {
    const responseBody = await response.text().catch(() => "")
    const compactResponseBody = responseBody.slice(0, 500).replace(/\s+/g, " ").trim()

    return {
      answer: null,
      failureReason: "request_error",
      details: `status=${response.status}${compactResponseBody ? ` body=${compactResponseBody}` : ""}`,
    }
  }

  let payload: unknown

  try {
    payload = await response.json()
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      answer: null,
      failureReason: "parsing_failure",
      details: `json_parse_error=${errorMessage}`,
    }
  }

  try {
    return extractResponseText(payload)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      answer: null,
      failureReason: "parsing_failure",
      details: `payload_parse_error=${errorMessage}`,
    }
  }
}

export async function POST(
  req: MedusaRequest<PostAdminHelpAskBody>,
  res: MedusaResponse<HelpAskResponse>
) {
  const logger = req.scope.resolve(ContainerRegistrationKeys.LOGGER)
  const { pathname, question } = req.validatedBody
  const context = findHelpContextByPath(pathname)
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY?.trim())

  logger.info(`[admin/help/ask] hasApiKey=${hasApiKey}`)

  if (!hasApiKey) {
    logger.warn("[admin/help/ask] fallback branch used reason=missing_openai_api_key")

    return res.json({
      answer: createFallbackAnswer(pathname, question),
      source: "Fallback",
      suggestions: context.suggestedQuestions,
      context_title: context.title,
    })
  }

  logger.info("[admin/help/ask] entering AI branch")

  const aiResult = await queryOpenAi(context.title, pathname, question)

  if (aiResult.answer) {
    logger.info("[admin/help/ask] AI branch success source=AI")

    return res.json({
      answer: aiResult.answer,
      source: "AI",
      suggestions: context.suggestedQuestions,
      context_title: context.title,
    })
  }

  logger.warn(
    `[admin/help/ask] fallback branch used reason=${aiResult.failureReason || "unknown"} details=${aiResult.details || "none"}`
  )

  return res.json({
    answer: createFallbackAnswer(pathname, question),
    source: "Fallback",
    suggestions: context.suggestedQuestions,
    context_title: context.title,
  })
}
