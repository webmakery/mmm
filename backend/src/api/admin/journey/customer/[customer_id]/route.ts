import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../../../../../modules/customer-journey"
import CustomerJourneyModuleService from "../../../../../modules/customer-journey/service"

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const customerId = req.params.customer_id
  const service: CustomerJourneyModuleService = req.scope.resolve(CUSTOMER_JOURNEY_MODULE)

  await service.recomputeCustomerRollup(customerId)
  const debugData = await service.getCustomerDebug(customerId)
  return res.status(200).json(debugData)
}
