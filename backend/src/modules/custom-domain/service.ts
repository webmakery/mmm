import { MedusaService } from "@medusajs/framework/utils"
import CustomDomain from "./models/custom-domain"

class CustomDomainModuleService extends MedusaService({
  CustomDomain,
}) {}

export default CustomDomainModuleService
