import { OpenAiLeadScoringProvider } from "../providers/openai-lead-scoring-provider"
import { NormalizedBusinessLead } from "../types"

describe("OpenAiLeadScoringProvider", () => {
  const lead: NormalizedBusinessLead = {
    dedupe_key: "acme-dental",
    first_name: "Acme",
    company: "Acme Dental",
    phone: "+15551111",
    website: "https://acmedental.example",
    category: "dentist",
    source: "google_places",
    source_detail: "google_places:g_1",
    notes_summary: "Popular local clinic.",
    metadata: {},
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it("falls back when AI returns malformed but parseable payload", async () => {
    const fetchMock = jest
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        json: async () => ({
          output_text: JSON.stringify({
            notes: "Missing score and outreach message",
            qualified: true,
            pain_points: ["none"],
          }),
        }),
      } as Response)

    const provider = new OpenAiLeadScoringProvider("test-api-key", "gpt-4.1-mini")

    const result = await provider.scoreLeadQuality(lead)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(result.notes).toBe("Scored with fallback after AI tool-calling error.")
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.outreach_message_draft).toContain("Acme Dental")
  })
})
