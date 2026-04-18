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

  private buildDeterministicAssessment(lead: NormalizedBusinessLead): {
    score: number
    qualified: boolean
    reasons: string[]
    notes: string
  } {
    const rating = Number(lead.metadata?.rating || 0)
    const reviewCount = Number(lead.metadata?.review_count || 0)
    const hasWebsite = Boolean(lead.website)
    const hasHttpsWebsite = Boolean(lead.website?.startsWith("https://"))
    const hasPhone = Boolean(lead.phone)

    let score = 40
    const reasons: string[] = ["base_score:40"]

    if (hasWebsite) {
      score += 20
      reasons.push("has_website:+20")
    } else {
      score -= 20
      reasons.push("missing_website:-20")
    }

    if (hasHttpsWebsite) {
      score += 10
      reasons.push("has_https:+10")
    }

    if (hasPhone) {
      score += 10
      reasons.push("has_phone:+10")
    } else {
      reasons.push("missing_phone:+0")
    }

    if (rating >= 4.2) {
      score += 10
      reasons.push("high_rating:+10")
    } else if (rating > 0 && rating < 3.8) {
      score -= 10
      reasons.push("low_rating:-10")
    }

    if (reviewCount >= 30) {
      score += 5
      reasons.push("review_count_30_plus:+5")
    }

    const normalizedScore = Math.max(10, Math.min(95, Math.round(score)))

    return {
      score: normalizedScore,
      qualified: normalizedScore >= 60,
      reasons,
      notes: `Deterministic fallback scoring (0-100 scale). ${reasons.join(", ")}.`,
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

    return parseJsonSafe<LeadScoreResult>(text, null as unknown as LeadScoreResult)
  }

  async scoreLeadQuality(lead: NormalizedBusinessLead): Promise<LeadScoreResult> {
    const fallbackPainPoints = this.detectPainPoints(lead).pain_points
    const deterministic = this.buildDeterministicAssessment(lead)

    if (!this.apiKey) {
      return {
        score: deterministic.score,
        notes: `${deterministic.notes} OpenAI key missing.`,
        pain_points: fallbackPainPoints,
        qualified: deterministic.qualified,
        qualification_reasons: deterministic.reasons,
        outreach_message_draft: `Hi ${lead.company}, we noticed opportunities to improve your online lead conversion. Open to a short call this week?`,
      }
    }

    const aiResult = await this.runWithTools(lead)

    if (!aiResult) {
      return {
        score: deterministic.score,
        notes: `${deterministic.notes} OpenAI scoring fallback triggered after tool-calling error.`,
        pain_points: fallbackPainPoints,
        qualified: deterministic.qualified,
        qualification_reasons: deterministic.reasons,
        outreach_message_draft: `Hi ${lead.company}, we noticed opportunities to improve your online lead conversion. Open to a short call this week?`,
      }
    }

    const normalizedScore = Number.isFinite(aiResult.score)
      ? Math.max(0, Math.min(100, Math.round(aiResult.score)))
      : deterministic.score

    return {
      score: normalizedScore,
      notes: `${aiResult.notes || "AI scoring completed."} Score scale: 0-100.`,
      pain_points: aiResult.pain_points || fallbackPainPoints,
      qualified: typeof aiResult.qualified === "boolean" ? aiResult.qualified : normalizedScore >= 60,
      qualification_reasons: aiResult.qualification_reasons || deterministic.reasons,
      outreach_message_draft: aiResult.outreach_message_draft,
    }
  }
}
