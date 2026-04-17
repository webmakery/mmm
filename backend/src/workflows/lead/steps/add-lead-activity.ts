import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { LEAD_MODULE } from "../../../modules/lead"
import LeadModuleService from "../../../modules/lead/service"
import { AddLeadActivityInput } from "../types"

export const addLeadActivityStep = createStep(
  "add-lead-activity-step",
  async (input: AddLeadActivityInput, { container }) => {
    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    const activity = await leadService.createLeadActivities(input)

    return new StepResponse(activity, activity.id)
  },
  async (activityId, { container }) => {
    if (!activityId) {
      return
    }

    const leadService: LeadModuleService = container.resolve(LEAD_MODULE)
    await leadService.deleteLeadActivities(activityId)
  }
)
