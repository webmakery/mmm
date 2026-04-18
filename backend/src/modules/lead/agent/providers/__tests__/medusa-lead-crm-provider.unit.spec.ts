import { MedusaLeadCrmProvider } from "../medusa-lead-crm-provider"

describe("MedusaLeadCrmProvider", () => {
  it("assigns preferred default stage and persists Google Map Leads tag", async () => {
    const leadService = {
      listLeadStages: jest.fn(async () => [
        { id: "stage_1", name: "Qualified" },
        { id: "stage_2", name: "Contacted" },
      ]),
      createLeadStages: jest.fn(),
      createLeads: jest.fn(async (payload) => ({ id: "lead_1", ...payload })),
    } as any

    const provider = new MedusaLeadCrmProvider(leadService)

    await provider.createQualifiedLead({
      first_name: "Acme Dental",
      company: "Acme Dental",
      source: "google_places",
      source_detail: "g_1",
      website: "https://acme.example",
      google_maps_uri: "https://maps.google.com/?cid=123",
      notes_summary: "note",
      lead_score: 85,
      lead_score_notes: "strong fit",
      pain_points: ["No website"],
      outreach_message_draft: "draft",
      metadata: { city: "Austin" },
    })

    expect(leadService.createLeads).toHaveBeenCalledWith({
      first_name: "Acme Dental",
      company: "Acme Dental",
      email: undefined,
      phone: undefined,
      website: "https://acme.example",
      google_maps_uri: "https://maps.google.com/?cid=123",
      source: "google_places",
      source_detail: "g_1",
      category: undefined,
      notes_summary: "note",
      lead_score: 85,
      lead_score_notes: "strong fit",
      pain_points: ["No website"],
      outreach_message_draft: "draft",
      status: "qualified",
      stage_id: "stage_1",
      follow_up_status: "not_scheduled",
      metadata: {
        city: "Austin",
        tags: ["Google Map Leads"],
        primary_tag: "Google Map Leads",
      },
    })
  })

  it("creates a fallback New stage when no stage exists", async () => {
    const leadService = {
      listLeadStages: jest.fn(async () => []),
      createLeadStages: jest.fn(async () => ({ id: "stage_new", name: "New" })),
      createLeads: jest.fn(async (payload) => ({ id: "lead_1", ...payload })),
    } as any

    const provider = new MedusaLeadCrmProvider(leadService)

    await provider.createQualifiedLead({
      first_name: "Acme Dental",
      company: "Acme Dental",
      source: "google_places",
      source_detail: "g_1",
      website: "https://acme.example",
      google_maps_uri: "https://maps.google.com/?cid=123",
      notes_summary: "note",
      lead_score: 85,
      lead_score_notes: "strong fit",
      pain_points: [],
      outreach_message_draft: "draft",
      metadata: {},
    })

    expect(leadService.createLeadStages).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "New",
      })
    )
    expect(leadService.createLeads).toHaveBeenCalledWith(expect.objectContaining({ stage_id: "stage_new" }))
  })
})
