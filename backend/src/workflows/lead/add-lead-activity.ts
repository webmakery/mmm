import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addLeadActivityStep } from "./steps/add-lead-activity"
import { AddLeadActivityInput } from "./types"

export const addLeadActivityWorkflow = createWorkflow("add-lead-activity", (input: AddLeadActivityInput) => {
  const activity = addLeadActivityStep(input)

  return new WorkflowResponse({ activity })
})
