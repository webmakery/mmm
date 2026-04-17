import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { updateLeadStep } from "./steps/update-lead"
import { UpdateLeadInput } from "./types"

export const updateLeadWorkflow = createWorkflow("update-lead", (input: UpdateLeadInput) => {
  const lead = updateLeadStep(input)

  return new WorkflowResponse({ lead })
})
