export type RawBusinessLead = {
  external_id: string
  name: string
  website?: string | null
  phone?: string | null
  address?: string | null
  category?: string | null
  rating?: number | null
  review_count?: number | null
  source: "google_places"
  metadata?: Record<string, unknown>
}

export type NormalizedBusinessLead = {
  dedupe_key: string
  first_name: string
  company: string
  email?: string
  phone?: string
  website?: string
  category?: string
  source: string
  source_detail: string
  notes_summary: string
  metadata: Record<string, unknown>
}

export type LeadScoreResult = {
  score: number
  notes: string
  pain_points: string[]
  qualified: boolean
  outreach_message_draft: string
  qualification_reasons?: string[]
}

export type QualifiedLeadResult = {
  lead_id: string
  company: string
  score: number
  outreach_message_draft: string
  follow_up_event_id?: string
}

export type LeadDisqualification = {
  company: string
  score: number
  reasons: string[]
}

export type DiscoverySummary = {
  discovered: number
  deduped: number
  qualified: number
  inserted_into_crm: number
  skipped_duplicates: number
  disqualified: number
  failed: number
}

export type DiscoverScoreAndQueueResult = {
  qualified: QualifiedLeadResult[]
  disqualified: LeadDisqualification[]
  summary: DiscoverySummary
}

export type DiscoveryInput = {
  query: string
  location: string
  max_results?: number
  min_score?: number
  max_crm_imports?: number
  follow_up_owner_email?: string
  enforce_ai_qualified?: boolean
}

export interface LeadDiscoveryProvider {
  fetchColdLeads(input: DiscoveryInput): Promise<RawBusinessLead[]>
}

export interface LeadScoringProvider {
  scoreLeadQuality(lead: NormalizedBusinessLead): Promise<LeadScoreResult>
}

export interface LeadCrmProvider {
  createQualifiedLead(input: {
    first_name: string
    company: string
    phone?: string
    source: string
    source_detail: string
    category?: string
    notes_summary: string
    lead_score: number
    lead_score_notes: string
    pain_points: string[]
    outreach_message_draft: string
    metadata: Record<string, unknown>
  }): Promise<{ id: string }>

  updateLeadStatus(
    leadId: string,
    input: {
      follow_up_status?: string
      follow_up_event_id?: string | null
      outreach_approved_at?: Date | null
      outreach_sent_at?: Date | null
      notes_summary?: string
      metadata_patch?: Record<string, unknown>
    }
  ): Promise<void>
}

export interface LeadCalendarProvider {
  createFollowUpEvent(input: {
    lead_id: string
    company: string
    when: Date
    owner_email?: string
    notes: string
  }): Promise<{ event_id: string }>
}

export interface OutreachProvider {
  sendOutreach(input: { lead_id: string; message: string; company: string }): Promise<{ provider_id?: string }>
}

export type ActionLogLevel = "info" | "error"

export interface LeadAgentLogger {
  log(level: ActionLogLevel, action: string, details: Record<string, unknown>): void
}
