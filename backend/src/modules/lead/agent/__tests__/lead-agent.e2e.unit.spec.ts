import { LeadAgentService } from "../service"
import { LeadAgentInputError } from "../errors"
import {
  LeadAgentLogger,
  LeadCrmProvider,
  LeadDiscoveryProvider,
  LeadScoringProvider,
  OutreachProvider,
  RawBusinessLead,
} from "../types"

describe("LeadAgentService end-to-end flow", () => {
  it("discovers, deduplicates, scores, creates CRM leads, schedules follow-up in CRM, and requires approval before outreach send", async () => {
    const discoveryProvider: LeadDiscoveryProvider = {
      fetchColdLeads: jest.fn(async () => {
        const leads: RawBusinessLead[] = [
          {
            external_id: "g_1",
            name: "Acme Dental",
            phone: "+1 555 1111",
            source: "google_places",
            website: "https://acmedental.example",
            category: "dentist",
          },
          {
            external_id: "g_1_duplicate",
            name: "Acme Dental",
            phone: "+1 555 1111",
            source: "google_places",
            website: "https://acmedental.example",
            category: "dentist",
          },
        ]

        return leads
      }),
    }

    const scoringProvider: LeadScoringProvider = {
      scoreLeadQuality: jest.fn(async () => ({
        score: 88,
        notes: "Strong website and clear category fit.",
        pain_points: ["Needs better lead-response speed"],
        qualified: true,
        outreach_message_draft: "Hi Acme Dental — noticed opportunities to improve your response flow.",
      })),
    }

    const crmProvider: LeadCrmProvider = {
      createQualifiedLead: jest.fn(async () => ({ id: "lead_123" })),
      updateLeadStatus: jest.fn(async () => undefined),
    }

    const outreachProvider: OutreachProvider = {
      sendOutreach: jest.fn(async () => ({ provider_id: "out_123" })),
    }

    const logger: LeadAgentLogger = {
      log: jest.fn(),
    }

    const service = new LeadAgentService(
      discoveryProvider,
      scoringProvider,
      crmProvider,
      outreachProvider,
      logger
    )

    const result = await service.discoverScoreAndQueue({
      query: "dentist",
      location: "Austin, TX",
      min_score: 70,
    })

    expect(discoveryProvider.fetchColdLeads).toHaveBeenCalledTimes(1)
    expect(scoringProvider.scoreLeadQuality).toHaveBeenCalledTimes(1)
    expect(crmProvider.createQualifiedLead).toHaveBeenCalledTimes(1)
    expect(outreachProvider.sendOutreach).toHaveBeenCalledTimes(0)

    expect(result.qualified).toHaveLength(1)
    expect(result.qualified[0]).toEqual(
      expect.objectContaining({
        lead_id: "lead_123",
        follow_up_status: "pending_approval",
      })
    )
    expect(result.summary).toEqual(
      expect.objectContaining({
        discovered: 2,
        deduped: 1,
        qualified: 1,
        inserted_into_crm: 1,
        skipped_duplicates: 1,
        disqualified: 0,
        failed: 0,
      })
    )

    expect(crmProvider.updateLeadStatus).toHaveBeenCalledWith(
      "lead_123",
      expect.objectContaining({
        follow_up_status: "pending_approval",
        next_follow_up_at: expect.any(Date),
      })
    )
  })

  it("does not retry validation/programming errors for discovery input", async () => {
    const discoveryProvider: LeadDiscoveryProvider = {
      fetchColdLeads: jest.fn(async () => {
        throw new LeadAgentInputError("location is required")
      }),
    }

    const service = new LeadAgentService(
      discoveryProvider,
      { scoreLeadQuality: jest.fn() } as unknown as LeadScoringProvider,
      { createQualifiedLead: jest.fn(), updateLeadStatus: jest.fn() } as unknown as LeadCrmProvider,
      { sendOutreach: jest.fn() } as unknown as OutreachProvider,
      { log: jest.fn() }
    )

    await expect(
      service.discoverScoreAndQueue({
        query: "dentist",
        location: "Austin, TX",
      })
    ).rejects.toThrow("location is required")

    expect(discoveryProvider.fetchColdLeads).toHaveBeenCalledTimes(1)
  })

  it("retries transient discovery errors", async () => {
    const discoveryProvider: LeadDiscoveryProvider = {
      fetchColdLeads: jest
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error("temporary upstream failure"), { statusCode: 503 }))
        .mockResolvedValueOnce([]),
    }

    const service = new LeadAgentService(
      discoveryProvider,
      { scoreLeadQuality: jest.fn() } as unknown as LeadScoringProvider,
      { createQualifiedLead: jest.fn(), updateLeadStatus: jest.fn() } as unknown as LeadCrmProvider,
      { sendOutreach: jest.fn() } as unknown as OutreachProvider,
      { log: jest.fn() }
    )

    await expect(
      service.discoverScoreAndQueue({
        query: "dentist",
        location: "Austin, TX",
      })
    ).resolves.toEqual({
      qualified: [],
      disqualified: [],
      summary: {
        discovered: 0,
        deduped: 0,
        qualified: 0,
        inserted_into_crm: 0,
        skipped_duplicates: 0,
        disqualified: 0,
        failed: 0,
      },
    })

    expect(discoveryProvider.fetchColdLeads).toHaveBeenCalledTimes(2)
  })

  it("supports explicit 0-100 min_score scale and max CRM imports", async () => {
    const discoveryProvider: LeadDiscoveryProvider = {
      fetchColdLeads: jest.fn(async () => {
        const leads: RawBusinessLead[] = [
          {
            external_id: "g_1",
            name: "Acme Dental",
            phone: "+1 555 1111",
            source: "google_places",
            website: "https://acmedental.example",
            category: "dentist",
          },
          {
            external_id: "g_2",
            name: "Beta Dental",
            phone: "+1 555 1112",
            source: "google_places",
            website: "https://betadental.example",
            category: "dentist",
          },
          {
            external_id: "g_3",
            name: "Gamma Dental",
            phone: "+1 555 1113",
            source: "google_places",
            website: "https://gammadental.example",
            category: "dentist",
          },
        ]

        return leads
      }),
    }

    const scoringProvider: LeadScoringProvider = {
      scoreLeadQuality: jest
        .fn()
        .mockResolvedValueOnce({
          score: 50,
          notes: "Good fit",
          pain_points: [],
          qualified: false,
          outreach_message_draft: "draft 1",
        })
        .mockResolvedValueOnce({
          score: 70,
          notes: "Great fit",
          pain_points: [],
          qualified: true,
          outreach_message_draft: "draft 2",
        })
        .mockResolvedValueOnce({
          score: 35,
          notes: "Low fit",
          pain_points: [],
          qualified: false,
          outreach_message_draft: "draft 3",
        }),
    }

    const crmProvider: LeadCrmProvider = {
      createQualifiedLead: jest
        .fn()
        .mockResolvedValueOnce({ id: "lead_1" })
        .mockResolvedValueOnce({ id: "lead_2" }),
      updateLeadStatus: jest.fn(async () => undefined),
    }

    const service = new LeadAgentService(
      discoveryProvider,
      scoringProvider,
      crmProvider,
      { sendOutreach: jest.fn() } as unknown as OutreachProvider,
      { log: jest.fn() }
    )

    const result = await service.discoverScoreAndQueue({
      query: "dentist",
      location: "Austin, TX",
      min_score: 40,
      max_crm_imports: 1,
    })

    expect(result.summary).toEqual({
      discovered: 3,
      deduped: 3,
      qualified: 2,
      inserted_into_crm: 1,
      skipped_duplicates: 0,
      disqualified: 1,
      failed: 0,
    })
    expect(result.disqualified).toEqual([
      expect.objectContaining({
        company: "Gamma Dental",
        score: 35,
        reasons: ["score_below_threshold:35<40"],
      }),
    ])
    expect(crmProvider.createQualifiedLead).toHaveBeenCalledTimes(1)
  })

  it("does not block crm insert on ai_qualified false unless enforce_ai_qualified is enabled", async () => {
    const discoveryProvider: LeadDiscoveryProvider = {
      fetchColdLeads: jest.fn(async () => [
        {
          external_id: "g_1",
          name: "Acme Dental",
          phone: "+1 555 1111",
          source: "google_places",
          website: "https://acmedental.example",
          category: "dentist",
        },
      ]),
    }

    const scoringProvider: LeadScoringProvider = {
      scoreLeadQuality: jest.fn(async () => ({
        score: 82,
        notes: "Good fit",
        pain_points: [],
        qualified: false,
        qualification_reasons: ["ai_signal_low_confidence"],
        outreach_message_draft: "draft",
      })),
    }

    const crmProvider: LeadCrmProvider = {
      createQualifiedLead: jest.fn(async () => ({ id: "lead_1" })),
      updateLeadStatus: jest.fn(async () => undefined),
    }

    const service = new LeadAgentService(
      discoveryProvider,
      scoringProvider,
      crmProvider,
      { sendOutreach: jest.fn() } as unknown as OutreachProvider,
      { log: jest.fn() }
    )

    await expect(
      service.discoverScoreAndQueue({
        query: "dentist",
        location: "Austin, TX",
        min_score: 70,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          inserted_into_crm: 1,
          disqualified: 0,
          failed: 0,
        }),
      })
    )

    await expect(
      service.discoverScoreAndQueue({
        query: "dentist",
        location: "Austin, TX",
        min_score: 70,
        enforce_ai_qualified: true,
      })
    ).resolves.toEqual(
      expect.objectContaining({
        summary: expect.objectContaining({
          inserted_into_crm: 0,
          disqualified: 1,
          failed: 0,
        }),
      })
    )
  })
})
