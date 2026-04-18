import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { findHelpContextByPath } from "../../../../admin/lib/admin-help-context"

export const PostAdminHelpAskSchema = z.object({
  pathname: z.string().min(1),
  question: z.string().min(1),
})

type PostAdminHelpAskBody = z.infer<typeof PostAdminHelpAskSchema>

type HelpAskResponse = {
  answer: string
  source: "ai" | "fallback"
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

const queryOpenAi = async (contextTitle: string, pathname: string, question: string) => {
  const apiKey = process.env.OPENAI_API_KEY
  const model = process.env.OPENAI_HELP_MODEL || "gpt-4.1-mini"

  if (!apiKey) {
    return null
  }

  const context = findHelpContextByPath(pathname)

  const response = await fetch("https://api.openai.com/v1/responses", {
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

  if (!response.ok) {
    throw new Error(`OpenAI request failed with status ${response.status}`)
  }

  const payload = await response.json()
  const text = typeof payload?.output_text === "string" ? payload.output_text.trim() : ""

  return text || null
}

export async function POST(
  req: MedusaRequest<PostAdminHelpAskBody>,
  res: MedusaResponse<HelpAskResponse>
) {
  const { pathname, question } = req.validatedBody
  const context = findHelpContextByPath(pathname)

  try {
    const aiAnswer = await queryOpenAi(context.title, pathname, question)

    if (aiAnswer) {
      return res.json({
        answer: aiAnswer,
        source: "ai",
        suggestions: context.suggestedQuestions,
        context_title: context.title,
      })
    }
  } catch {
    // Gracefully fall back to local contextual guidance.
  }

  return res.json({
    answer: createFallbackAnswer(pathname, question),
    source: "fallback",
    suggestions: context.suggestedQuestions,
    context_title: context.title,
  })
}
