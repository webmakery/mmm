import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import CustomDomainService from "../../../../../services/custom-domain-service"

export const POST = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = new CustomDomainService(req.scope)
  const domain = await service.verifyDomain(req.params.id)

  res.json({
    custom_domain: domain,
  })
}
