import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import CustomDomainService from "../../../../services/custom-domain-service"

export const DELETE = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = new CustomDomainService(req.scope)

  const domain = await service.markRemoved(req.params.id)

  res.json({
    id: domain.id,
    status: domain.status,
  })
}
