import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { UpdateLeadInput } from "../types"

export const updateLeadStep = createStep(
  "update-lead-step",
  async (input: UpdateLeadInput, { container }) => {
    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    const [existing] = await leadService.listLeads({ id: [input.id] })

    const { id, ...updateInput } = input

    const lead = await leadService.updateLeads({
      id,
      ...updateInput,
      next_follow_up_at:
        updateInput.next_follow_up_at !== undefined && updateInput.next_follow_up_at !== null
          ? new Date(updateInput.next_follow_up_at)
          : updateInput.next_follow_up_at,
    } as any)

    return new StepResponse(lead, existing)
  },
  async (rollbackData, { container }) => {
    if (!rollbackData?.id) {
      return
    }

    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    await leadService.updateLeads({
      id: rollbackData.id,
      first_name: rollbackData.first_name,
      last_name: rollbackData.last_name,
      email: rollbackData.email,
      phone: rollbackData.phone,
      website: rollbackData.website,
      google_maps_uri: rollbackData.google_maps_uri,
      company: rollbackData.company,
      source: rollbackData.source,
      status: rollbackData.status,
      stage_id: rollbackData.stage_id,
      owner_user_id: rollbackData.owner_user_id,
      value_estimate: rollbackData.value_estimate,
      notes_summary: rollbackData.notes_summary,
      next_follow_up_at: rollbackData.next_follow_up_at,
      metadata: rollbackData.metadata,
      customer_id: rollbackData.customer_id,
    } as any)
  }
)
