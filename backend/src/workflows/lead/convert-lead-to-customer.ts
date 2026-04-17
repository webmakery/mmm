import { MedusaError } from "@medusajs/framework/utils"
import { createWorkflow, createStep, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { Modules } from "@medusajs/framework/utils"
import { addLeadActivityStep } from "./steps/add-lead-activity"
import { updateLeadStep } from "./steps/update-lead"
import { useQueryGraphStep } from "@medusajs/medusa/core-flows"

type ConvertLeadInput = {
  id: string
  created_by?: string
}

const ensureCustomerForLeadStep = createStep(
  "ensure-customer-for-lead-step",
  async (
    input: {
      id: string
      first_name: string
      last_name?: string | null
      email?: string | null
      phone?: string | null
      company?: string | null
      customer_id?: string | null
    },
    { container }
  ) => {
    if (input.customer_id) {
      return new StepResponse({ id: input.customer_id }, null)
    }

    if (!input.email) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Lead email is required to convert")
    }

    const customerService = container.resolve(Modules.CUSTOMER)
    const existing = await customerService.listCustomers({ email: input.email }, { take: 1 })

    if (existing.length > 0) {
      return new StepResponse(existing[0], null)
    }

    const customer = await customerService.createCustomers({
      email: input.email,
      first_name: input.first_name,
      last_name: input.last_name || undefined,
      phone: input.phone || undefined,
      company_name: input.company || undefined,
    })

    return new StepResponse(customer, customer.id)
  },
  async (customerId, { container }) => {
    if (!customerId) {
      return
    }

    const customerService = container.resolve(Modules.CUSTOMER)
    await customerService.deleteCustomers(customerId)
  }
)

export const convertLeadToCustomerWorkflow = createWorkflow(
  "convert-lead-to-customer",
  (input: ConvertLeadInput) => {
    const { data: leads } = useQueryGraphStep({
      entity: "lead",
      fields: ["id", "first_name", "last_name", "email", "phone", "company", "customer_id"],
      filters: { id: input.id },
      options: { throwIfKeyNotFound: true },
    })

    const { data: wonStages } = useQueryGraphStep({
      entity: "lead_stage",
      fields: ["id", "slug"],
      filters: { slug: "won" },
      options: { throwIfKeyNotFound: true },
    })

    const customer = ensureCustomerForLeadStep({
      id: leads[0].id,
      first_name: leads[0].first_name,
      last_name: leads[0].last_name,
      email: leads[0].email,
      phone: leads[0].phone,
      company: leads[0].company,
      customer_id: leads[0].customer_id,
    })

    const lead = updateLeadStep({
      id: input.id,
      customer_id: customer.id,
      status: "won",
      stage_id: wonStages[0].id,
    })

    addLeadActivityStep({
      lead_id: input.id,
      type: "status_change",
      content: `Lead converted to customer ${customer.id}`,
      created_by: input.created_by,
      completed_at: new Date(),
    })

    return new WorkflowResponse({ lead, customer })
  }
)
