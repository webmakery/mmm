import { LeadActivityTypes } from "../../modules/lead/models/lead-activity"
import { LeadStatuses } from "../../modules/lead/models/lead"

export type LeadStatus = (typeof LeadStatuses)[number]
export type LeadActivityType = (typeof LeadActivityTypes)[number]

export type CreateLeadInput = {
  first_name: string
  last_name?: string | null
  email?: string | null
  phone?: string | null
  company?: string | null
  source?: string | null
  status?: LeadStatus
  stage_id?: string | null
  owner_user_id?: string | null
  value_estimate?: number | null
  notes_summary?: string | null
  next_follow_up_at?: string | Date | null
  metadata?: Record<string, unknown> | null
}

export type UpdateLeadInput = Partial<CreateLeadInput> & {
  id: string
  customer_id?: string | null
}

export type AddLeadActivityInput = {
  lead_id: string
  type: LeadActivityType
  content: string
  created_by?: string | null
  due_at?: string | Date | null
  completed_at?: string | Date | null
}
