import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { CreateLeadInput } from "../types"

export const createLeadStep = createStep(
  "create-lead-step",
  async (input: CreateLeadInput, { container }) => {
    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    const lead = await leadService.createLeads(input)

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
