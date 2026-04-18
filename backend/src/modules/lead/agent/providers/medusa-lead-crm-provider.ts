import LeadModuleService from "../../service"
import { LeadCrmProvider } from "../types"

const GOOGLE_MAP_LEAD_TAG = "Google Map Leads"

export class MedusaLeadCrmProvider implements LeadCrmProvider {
  constructor(private readonly leadService: LeadModuleService) {}

  private async resolveDefaultStageId() {
    const stages = await this.leadService.listLeadStages({}, { take: 100 })

    const preferredStage =
      stages.find((stage) => stage.name?.toLowerCase() === "new") ||
      stages.find((stage) => stage.name?.toLowerCase() === "qualified") ||
      stages[0]

    if (preferredStage?.id) {
      return preferredStage.id
    }

    const createdStage = await this.leadService.createLeadStages({
      name: "New",
      slug: "new",
      sort_order: 0,
    })

    if (!createdStage?.id) {
      const error = new Error(
        "Unable to resolve a default lead stage. Create a 'New' or 'Qualified' stage in CRM pipeline settings."
      ) as Error & { code: string }
      error.code = "VALIDATION_ERROR"
      throw error
    }

    return createdStage.id
  }

  async createQualifiedLead(input: {
    first_name: string
    company: string
    email?: string
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
  }): Promise<{ id: string }> {
    const stageId = await this.resolveDefaultStageId()

    const lead = await this.leadService.createLeads({
      first_name: input.first_name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      source: input.source,
      source_detail: input.source_detail,
      category: input.category,
      notes_summary: input.notes_summary,
      lead_score: input.lead_score,
      lead_score_notes: input.lead_score_notes,
      pain_points: input.pain_points,
      outreach_message_draft: input.outreach_message_draft,
      status: "qualified",
      stage_id: stageId,
      follow_up_status: "not_scheduled",
      metadata: {
        ...(input.metadata || {}),
        tags: [GOOGLE_MAP_LEAD_TAG],
        primary_tag: GOOGLE_MAP_LEAD_TAG,
      },
    })

    return {
      id: lead.id,
    }
  }

  async updateLeadStatus(
    leadId: string,
    input: {
      follow_up_status?: string
      next_follow_up_at?: Date | null
      owner_user_id?: string | null
      outreach_approved_at?: Date | null
      outreach_sent_at?: Date | null
      notes_summary?: string
      metadata_patch?: Record<string, unknown>
    }
  ) {
    const [currentLead] = await this.leadService.listLeads({ id: leadId }, { take: 1 })

    await this.leadService.updateLeads({
      id: leadId,
      follow_up_status: input.follow_up_status,
      next_follow_up_at: input.next_follow_up_at,
      owner_user_id: input.owner_user_id,
      outreach_approved_at: input.outreach_approved_at,
      outreach_sent_at: input.outreach_sent_at,
      notes_summary: input.notes_summary,
      metadata: {
        ...(currentLead?.metadata || {}),
        ...(input.metadata_patch || {}),
      },
    })
  }
}
