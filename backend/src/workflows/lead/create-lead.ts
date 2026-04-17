import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { createLeadStep } from "./steps/create-lead"
import { CreateLeadInput } from "./types"

export const createLeadWorkflow = createWorkflow("create-lead", (input: CreateLeadInput) => {
  const lead = createLeadStep(input)

  return new WorkflowResponse({ lead })
})
