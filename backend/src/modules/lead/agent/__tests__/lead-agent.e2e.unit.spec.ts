import { LeadAgentService } from "../service"
import {
  LeadAgentLogger,
  LeadCalendarProvider,
  LeadCrmProvider,
  LeadDiscoveryProvider,
  LeadScoringProvider,
  OutreachProvider,
  RawBusinessLead,
} from "../types"

describe("LeadAgentService end-to-end flow", () => {
  it("discovers, deduplicates, scores, creates CRM leads, schedules follow-up, and requires approval before outreach send", async () => {
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

    const calendarProvider: LeadCalendarProvider = {
      createFollowUpEvent: jest.fn(async () => ({ event_id: "evt_123" })),
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
      calendarProvider,
      outreachProvider,
      logger
    )

    const queued = await service.discoverScoreAndQueue({
      query: "dentist",
      location: "Austin, TX",
      min_score: 70,
    })

    expect(discoveryProvider.fetchColdLeads).toHaveBeenCalledTimes(1)
    expect(scoringProvider.scoreLeadQuality).toHaveBeenCalledTimes(1)
    expect(crmProvider.createQualifiedLead).toHaveBeenCalledTimes(1)
    expect(calendarProvider.createFollowUpEvent).toHaveBeenCalledTimes(1)
    expect(outreachProvider.sendOutreach).toHaveBeenCalledTimes(0)

    expect(queued).toHaveLength(1)
    expect(queued[0]).toEqual(
      expect.objectContaining({
        lead_id: "lead_123",
        follow_up_event_id: "evt_123",
      })
    )

    expect(crmProvider.updateLeadStatus).toHaveBeenCalledWith(
      "lead_123",
      expect.objectContaining({
        follow_up_status: "pending_approval",
      })
    )
  })
})
