import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import LeadModuleService from "../service"
import {
  DiscoveryInput,
  LeadAgentLogger,
  LeadCalendarProvider,
  LeadCrmProvider,
  LeadDiscoveryProvider,
  LeadScoringProvider,
  NormalizedBusinessLead,
  OutreachProvider,
  QualifiedLeadResult,
  RawBusinessLead,
} from "./types"

const withRetry = async <T>(action: () => Promise<T>, retries: number, label: string, logger: LeadAgentLogger) => {
  let latestError: unknown

  for (let attempt = 1; attempt <= retries + 1; attempt += 1) {
    try {
      if (attempt > 1) {
        logger.log("info", "retry_attempt", { label, attempt })
      }

      return await action()
    } catch (error) {
      latestError = error
      logger.log("error", "retry_error", {
        label,
        attempt,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  throw latestError
}

const normalizeLead = (lead: RawBusinessLead): NormalizedBusinessLead => {
  const normalizedCompany = lead.name.trim()
  const normalizedPhone = lead.phone?.replace(/\s+/g, "")
  const dedupeKey = `${normalizedCompany.toLowerCase()}::${(normalizedPhone || lead.address || lead.external_id).toLowerCase()}`

  return {
    dedupe_key: dedupeKey,
    first_name: normalizedCompany,
    company: normalizedCompany,
    phone: normalizedPhone,
    website: lead.website || undefined,
    category: lead.category || undefined,
    source: "google_places",
    source_detail: lead.external_id,
    notes_summary: `Discovered via Google Places. Address: ${lead.address || "N/A"}. Rating: ${lead.rating || "N/A"}.`,
    metadata: {
      address: lead.address,
      rating: lead.rating,
      review_count: lead.review_count,
      raw_source: lead.source,
      ...(lead.metadata || {}),
    },
  }
}

const dedupeLeads = (leads: NormalizedBusinessLead[]) => {
  const map = new Map<string, NormalizedBusinessLead>()

  for (const lead of leads) {
    if (!map.has(lead.dedupe_key)) {
      map.set(lead.dedupe_key, lead)
    }
  }

  return [...map.values()]
}

export class DefaultLeadAgentLogger implements LeadAgentLogger {
  constructor(private readonly logger: { info: (msg: string) => void; error: (msg: string) => void }) {}

  log(level: "info" | "error", action: string, details: Record<string, unknown>): void {
    const message = `[lead-agent] action=${action} details=${JSON.stringify(details)}`

    if (level === "error") {
      this.logger.error(message)
      return
    }

    this.logger.info(message)
  }
}

export class LeadAgentService {
  constructor(
    private readonly discoveryProvider: LeadDiscoveryProvider,
    private readonly scoringProvider: LeadScoringProvider,
    private readonly crmProvider: LeadCrmProvider,
    private readonly calendarProvider: LeadCalendarProvider,
    private readonly outreachProvider: OutreachProvider,
    private readonly logger: LeadAgentLogger
  ) {}

  async discoverScoreAndQueue(input: DiscoveryInput): Promise<QualifiedLeadResult[]> {
    this.logger.log("info", "discovery_start", { input })

    const discovered = await withRetry(
      () => this.discoveryProvider.fetchColdLeads(input),
      2,
      "fetchColdLeads",
      this.logger
    )

    this.logger.log("info", "discovery_complete", { count: discovered.length })

    const normalized = dedupeLeads(discovered.map(normalizeLead))
    this.logger.log("info", "normalize_and_dedupe_complete", {
      before: discovered.length,
      after: normalized.length,
    })

    const minScore = Math.max(1, Math.min(100, input.min_score || 65))
    const qualifiedResults: QualifiedLeadResult[] = []

    for (const candidate of normalized) {
      try {
        const scoreResult = await withRetry(
          () => this.scoringProvider.scoreLeadQuality(candidate),
          1,
          "scoreLeadQuality",
          this.logger
        )

        this.logger.log("info", "lead_scored", {
          company: candidate.company,
          score: scoreResult.score,
        })

        if (!scoreResult.qualified || scoreResult.score < minScore) {
          this.logger.log("info", "lead_disqualified", {
            company: candidate.company,
            score: scoreResult.score,
          })
          continue
        }

        const crmLead = await withRetry(
          () =>
            this.crmProvider.createQualifiedLead({
              first_name: candidate.first_name,
              company: candidate.company,
              phone: candidate.phone,
              source: candidate.source,
              source_detail: candidate.source_detail,
              category: candidate.category,
              notes_summary: candidate.notes_summary,
              lead_score: scoreResult.score,
              lead_score_notes: scoreResult.notes,
              pain_points: scoreResult.pain_points,
              outreach_message_draft: scoreResult.outreach_message_draft,
              metadata: {
                ...candidate.metadata,
                website: candidate.website,
              },
            }),
          2,
          "createQualifiedLead",
          this.logger
        )

        const followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
        const followUpEvent = await withRetry(
          () =>
            this.calendarProvider.createFollowUpEvent({
              lead_id: crmLead.id,
              company: candidate.company,
              when: followUpAt,
              owner_email: input.follow_up_owner_email,
              notes: scoreResult.notes,
            }),
          2,
          "createFollowUpEvent",
          this.logger
        )

        await this.crmProvider.updateLeadStatus(crmLead.id, {
          follow_up_status: "pending_approval",
          follow_up_event_id: followUpEvent.event_id,
          metadata_patch: {
            outreach_message_draft: scoreResult.outreach_message_draft,
          },
        })

        qualifiedResults.push({
          lead_id: crmLead.id,
          company: candidate.company,
          score: scoreResult.score,
          outreach_message_draft: scoreResult.outreach_message_draft,
          follow_up_event_id: followUpEvent.event_id,
        })

        this.logger.log("info", "lead_qualified_and_queued", {
          lead_id: crmLead.id,
          company: candidate.company,
          follow_up_event_id: followUpEvent.event_id,
        })
      } catch (error) {
        this.logger.log("error", "lead_processing_failed", {
          company: candidate.company,
          error: error instanceof Error ? error.message : String(error),
        })
      }
    }

    return qualifiedResults
  }

  async approveAndSendOutreach(leadService: LeadModuleService, leadId: string) {
    const [lead] = await leadService.listLeads({ id: leadId }, { take: 1 })

    if (!lead) {
      throw new Error(`Lead ${leadId} not found`)
    }

    if (lead.follow_up_status !== "pending_approval") {
      throw new Error(
        `Lead ${leadId} is not pending outreach approval (current status: ${lead.follow_up_status || "unknown"})`
      )
    }

    if (!lead.outreach_message_draft) {
      throw new Error(`Lead ${leadId} has no outreach draft to approve`)
    }

    await this.crmProvider.updateLeadStatus(leadId, {
      follow_up_status: "approved",
      outreach_approved_at: new Date(),
    })

    const sendResult = await withRetry(
      () =>
        this.outreachProvider.sendOutreach({
          lead_id: leadId,
          message: lead.outreach_message_draft,
          company: lead.company || lead.first_name,
        }),
      1,
      "sendOutreach",
      this.logger
    )

    await this.crmProvider.updateLeadStatus(leadId, {
      follow_up_status: "sent",
      outreach_sent_at: new Date(),
      metadata_patch: {
        outreach_provider_id: sendResult.provider_id,
      },
    })

    return {
      id: leadId,
      status: "sent",
      provider_id: sendResult.provider_id,
    }
  }
}

export const buildLeadAgentService = (container: { resolve: <T>(name: string) => T }) => {
  const leadService = container.resolve<LeadModuleService>("lead")
  const medusaLogger = container.resolve<{ info: (message: string) => void; error: (message: string) => void }>(
    ContainerRegistrationKeys.LOGGER
  )
  const logger = new DefaultLeadAgentLogger(medusaLogger)

  const placesApiKey = process.env.GOOGLE_PLACES_API_KEY?.trim() || ""
  const calendarAccessToken = process.env.GOOGLE_CALENDAR_ACCESS_TOKEN?.trim() || ""
  const calendarId = process.env.GOOGLE_CALENDAR_ID?.trim() || "primary"
  const openAiApiKey = process.env.OPENAI_API_KEY?.trim() || ""

  const { GooglePlacesLeadDiscoveryProvider } = require("./providers/google-places-provider")
  const { OpenAiLeadScoringProvider } = require("./providers/openai-lead-scoring-provider")
  const { MedusaLeadCrmProvider } = require("./providers/medusa-lead-crm-provider")
  const { GoogleCalendarProvider } = require("./providers/google-calendar-provider")
  const { StubOutreachProvider } = require("./providers/stub-outreach-provider")

  return new LeadAgentService(
    new GooglePlacesLeadDiscoveryProvider(placesApiKey),
    new OpenAiLeadScoringProvider(openAiApiKey),
    new MedusaLeadCrmProvider(leadService),
    new GoogleCalendarProvider(calendarAccessToken, calendarId),
    new StubOutreachProvider(),
    logger
  )
}
