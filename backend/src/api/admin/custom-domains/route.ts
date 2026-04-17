import { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework"
import { z } from "@medusajs/framework/zod"
import CustomDomainService from "../../../services/custom-domain-service"
import { DomainValidationError } from "../../../services/custom-domains/domain-validation"

export const PostAdminCustomDomainsSchema = z.object({
  domain: z.string().min(1),
})
type PostAdminCustomDomains = z.infer<typeof PostAdminCustomDomainsSchema>

export const GET = async (req: AuthenticatedMedusaRequest, res: MedusaResponse) => {
  const service = new CustomDomainService(req.scope)
  const domains = await service.listDomains()

  res.json({
    custom_domains: domains,
    count: domains.length,
  })
}

export const POST = async (req: AuthenticatedMedusaRequest<PostAdminCustomDomains>, res: MedusaResponse) => {
  const service = new CustomDomainService(req.scope)

  try {
    const created = await service.createDomain({ domain: req.validatedBody.domain })

    res.status(201).json(created)
  } catch (error: any) {
    if (error instanceof DomainValidationError) {
      res.status(400).json({
        type: "invalid_data",
        message: error.message,
      })
      return
    }

    if (error?.message === "Domain already exists") {
      res.status(409).json({
        type: "duplicate_error",
        message: error.message,
      })
      return
    }

    throw error
  }
}
