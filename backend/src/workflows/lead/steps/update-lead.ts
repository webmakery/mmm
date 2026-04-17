import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { UpdateLeadInput } from "../types"

export const updateLeadStep = createStep(
  "update-lead-step",
  async (input: UpdateLeadInput, { container }) => {
    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    const [existing] = await leadService.listLeads({ id: [input.id] })

    const lead = await leadService.updateLeads({
      id: input.id,
      ...input,
    })

    return new StepResponse(lead, existing)
  },
  async (rollbackData, { container }) => {
    if (!rollbackData?.id) {
      return
    }

    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    await leadService.updateLeads(rollbackData)
  }
)
