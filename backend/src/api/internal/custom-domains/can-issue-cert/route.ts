import { MedusaRequest, MedusaResponse } from "@medusajs/framework"
import CustomDomainService from "../../../../services/custom-domain-service"

const isLoopback = (ip: string | undefined): boolean => {
  if (!ip) {
    return false
  }

  return ip === "127.0.0.1" || ip === "::1" || ip === "::ffff:127.0.0.1"
}

const isAuthorizedInternalRequest = (req: MedusaRequest): boolean => {
  const expectedSecret = process.env.INTERNAL_CUSTOM_DOMAIN_SECRET
  const providedSecret = req.get("x-internal-secret")

  if (expectedSecret && providedSecret === expectedSecret) {
    return true
  }

  return isLoopback(req.ip)
}

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  if (!isAuthorizedInternalRequest(req)) {
    res.status(403).json({ allowed: false })
    return
  }

  const domain = String(req.query.domain ?? "")
  const service = new CustomDomainService(req.scope)
  const allowed = await service.canIssueCertificate(domain)

  if (!allowed) {
    res.status(403).json({ allowed: false })
    return
  }

  res.status(200).json({ allowed: true })
}
