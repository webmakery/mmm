import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { addLeadActivityStep } from "./steps/add-lead-activity"
import { updateLeadStep } from "./steps/update-lead"

type ScheduleFollowUpInput = {
  id: string
  due_at: string
  content?: string
  created_by?: string
}

export const scheduleFollowUpWorkflow = createWorkflow("schedule-follow-up", (input: ScheduleFollowUpInput) => {
  const lead = updateLeadStep({
    id: input.id,
    next_follow_up_at: input.due_at,
  })

  const activity = addLeadActivityStep({
    lead_id: input.id,
    type: "task",
    content: input.content || "Follow-up task",
    due_at: input.due_at,
    created_by: input.created_by,
  })

  return new WorkflowResponse({ lead, activity })
})
