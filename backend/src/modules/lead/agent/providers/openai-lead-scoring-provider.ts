import { LeadScoringProvider, LeadScoreResult, NormalizedBusinessLead } from "../types"

type OpenAiToolCall = {
  id: string
  type: "function_call"
  name: string
  arguments: string
  call_id: string
}

const parseJsonSafe = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const isValidLeadScoreResult = (value: unknown): value is LeadScoreResult => {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<LeadScoreResult>

  return (
    typeof candidate.score === "number" &&
    Number.isFinite(candidate.score) &&
    typeof candidate.notes === "string" &&
    Array.isArray(candidate.pain_points) &&
    candidate.pain_points.every((item) => typeof item === "string") &&
    typeof candidate.qualified === "boolean" &&
    typeof candidate.outreach_message_draft === "string" &&
    candidate.outreach_message_draft.trim().length > 0
  )
}

export class OpenAiLeadScoringProvider implements LeadScoringProvider {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = process.env.OPENAI_LEAD_AGENT_MODEL || "gpt-4.1-mini"
  ) {}

  private evaluateWebsiteQuality(lead: NormalizedBusinessLead) {
    const website = lead.website || ""
    const hasSecureUrl = website.startsWith("https://")
    const hasOwnDomain = website.includes(".") && !website.includes("google.com")

    const score = (hasSecureUrl ? 20 : 0) + (hasOwnDomain ? 20 : 0)
    return {
      website_score: score,
      has_secure_url: hasSecureUrl,
      has_own_domain: hasOwnDomain,
    }
  }

  private detectPainPoints(lead: NormalizedBusinessLead) {
    const notes = lead.notes_summary.toLowerCase()
    const painPoints: string[] = []

    if (!lead.website) {
      painPoints.push("No visible business website")
    }

    if (notes.includes("low rating") || Number(lead.metadata?.rating || 0) < 4) {
      painPoints.push("Reputation concerns from public ratings")
    }

    if (!lead.phone) {
      painPoints.push("Missing clear phone contact")
    }

    return {
      pain_points: painPoints,
    }
  }

  private async runWithTools(lead: NormalizedBusinessLead): Promise<LeadScoreResult | null> {
    let response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        input: [
          {
            role: "system",
            content:
              "You are a lead-quality AI agent. Use tools first, then return a final JSON object with score, notes, pain_points, qualified, outreach_message_draft.",
          },
          {
            role: "user",
            content: JSON.stringify(lead),
          },
        ],
        tools: [
          {
            type: "function",
            name: "evaluate_website_quality",
            description: "Evaluate website quality and trust markers",
            parameters: {
              type: "object",
              properties: {},
            },
          },
          {
            type: "function",
            name: "detect_pain_points",
            description: "Detect obvious business pain points from visible data",
            parameters: {
              type: "object",
              properties: {},
            },
          },
        ],
      }),
    })

    if (!response.ok) {
      return null
    }

    let payload = (await response.json()) as { output?: Array<Record<string, unknown>>; output_text?: string; id?: string }
    const maxIterations = 3

    for (let i = 0; i < maxIterations; i += 1) {
      const toolCalls = (payload.output || []).filter((item) => item.type === "function_call") as unknown as OpenAiToolCall[]
      if (!toolCalls.length) {
        break
      }

      const toolOutputs = toolCalls.map((toolCall) => {
        if (toolCall.name === "evaluate_website_quality") {
          return {
            type: "function_call_output",
            call_id: toolCall.call_id,
            output: JSON.stringify(this.evaluateWebsiteQuality(lead)),
          }
        }

        return {
          type: "function_call_output",
          call_id: toolCall.call_id,
          output: JSON.stringify(this.detectPainPoints(lead)),
        }
      })

      response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          previous_response_id: payload.id,
          input: toolOutputs,
        }),
      })

      if (!response.ok) {
        return null
      }

      payload = (await response.json()) as { output?: Array<Record<string, unknown>>; output_text?: string; id?: string }
    }

    const text = payload.output_text?.trim()
    if (!text) {
      return null
    }

    const parsed = parseJsonSafe<unknown>(text, null)
    if (!isValidLeadScoreResult(parsed)) {
      return null
    }

    return parsed
  }

  async scoreLeadQuality(lead: NormalizedBusinessLead): Promise<LeadScoreResult> {
    const fallbackPainPoints = this.detectPainPoints(lead).pain_points
    const fallbackScore = Math.max(30, Math.min(95, Math.round((lead.website ? 30 : 10) + (lead.phone ? 20 : 0) + 40)))

    if (!this.apiKey) {
      return {
        score: fallbackScore,
        notes: "Scored with deterministic fallback due to missing OpenAI API key.",
        pain_points: fallbackPainPoints,
        qualified: fallbackScore >= 60,
        outreach_message_draft: `Hi ${lead.company}, we noticed opportunities to improve your online lead conversion. Open to a short call this week?`,
      }
    }

    const aiResult = await this.runWithTools(lead)

    if (!aiResult) {
      return {
        score: fallbackScore,
        notes: "Scored with fallback after AI tool-calling error.",
        pain_points: fallbackPainPoints,
        qualified: fallbackScore >= 60,
        outreach_message_draft: `Hi ${lead.company}, we noticed opportunities to improve your online lead conversion. Open to a short call this week?`,
      }
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(aiResult.score))),
      notes: aiResult.notes,
      pain_points: aiResult.pain_points || fallbackPainPoints,
      qualified: Boolean(aiResult.qualified),
      outreach_message_draft: aiResult.outreach_message_draft,
    }
  }
}
