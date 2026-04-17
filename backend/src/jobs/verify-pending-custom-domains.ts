import { MedusaContainer } from "@medusajs/framework/types"
import CustomDomainService from "../services/custom-domain-service"

export default async function verifyPendingCustomDomainsJob(container: MedusaContainer) {
  const logger = container.resolve("logger")
  const service = new CustomDomainService(container)

  const checkedCount = await service.verifyPendingDomains(100)

  logger.info(`Custom-domain DNS verification checked ${checkedCount} domains.`)
}

export const config = {
  name: "verify-pending-custom-domains",
  schedule: "*/10 * * * *",
}
