import { LoaderOptions } from "@medusajs/framework/types"
import TeamRbacModuleService from "../service"
import { RBAC_MODULE } from "../constants"

export default async function seedDefaultRoles({ container }: LoaderOptions) {
  const service: TeamRbacModuleService = container.resolve(RBAC_MODULE)
  await service.ensureDefaultRoles()
}
