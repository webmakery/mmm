import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { acquireLockStep, releaseLockStep } from "@medusajs/medusa/core-flows"
import provisionHetznerServerStep from "./steps/provision-hetzner-server"

type WorkflowInput = {
  infrastructure_id: string
}

const provisionSubscriptionInfrastructureWorkflow = createWorkflow(
  "provision-subscription-infrastructure",
  (input: WorkflowInput) => {
    acquireLockStep({
      key: input.infrastructure_id,
      timeout: 2,
      ttl: 60,
    })

    const result = provisionHetznerServerStep({
      infrastructure_id: input.infrastructure_id,
    })

    releaseLockStep({
      key: input.infrastructure_id,
    })

    return new WorkflowResponse(result)
  }
)

export default provisionSubscriptionInfrastructureWorkflow
