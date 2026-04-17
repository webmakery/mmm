import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addLeadActivityStep } from "./steps/add-lead-activity"
import { updateLeadStep } from "./steps/update-lead"

type MoveLeadStageInput = {
  id: string
  stage_id: string
  status?: "new" | "contacted" | "qualified" | "won" | "lost"
  created_by?: string
}

export const moveLeadStageWorkflow = createWorkflow("move-lead-stage", (input: MoveLeadStageInput) => {
  const lead = updateLeadStep({
    id: input.id,
    stage_id: input.stage_id,
    status: input.status,
  })

  const activity = addLeadActivityStep({
    lead_id: input.id,
    type: "status_change",
    content: `Lead moved to stage ${input.stage_id}${input.status ? ` with status ${input.status}` : ""}`,
    created_by: input.created_by,
  })

  return new WorkflowResponse({ lead, activity })
})
