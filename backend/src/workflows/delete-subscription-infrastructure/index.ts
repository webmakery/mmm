import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import deleteHetznerServerStep from "./steps/delete-hetzner-server"

type WorkflowInput = {
  infrastructure_id: string
}

const deleteSubscriptionInfrastructureWorkflow = createWorkflow(
  "delete-subscription-infrastructure",
  (input: WorkflowInput) => {
    const result = deleteHetznerServerStep({
      infrastructure_id: input.infrastructure_id,
    })

    return new WorkflowResponse(result)
  }
)

export default deleteSubscriptionInfrastructureWorkflow
