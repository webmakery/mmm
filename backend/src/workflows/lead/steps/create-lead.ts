import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { CreateLeadInput } from "../types"

export const createLeadStep = createStep(
  "create-lead-step",
  async (input: CreateLeadInput, { container }) => {
    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    const lead = await leadService.createLeads({
      ...input,
      next_follow_up_at:
        input.next_follow_up_at !== undefined && input.next_follow_up_at !== null
          ? new Date(input.next_follow_up_at)
          : input.next_follow_up_at ?? null,
    } as any)

    return new StepResponse(lead, lead.id)
  },
  async (leadId, { container }) => {
    if (!leadId) {
      return
    }

    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    await leadService.deleteLeads(leadId)
  }
)
