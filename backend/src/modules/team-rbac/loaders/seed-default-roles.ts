import { IMedusaInternalService, LoaderOptions } from "@medusajs/framework/types"
import Role from "../models/role"
import { DEFAULT_ROLE_DEFINITIONS } from "../constants"

export default async function seedDefaultRoles({ container }: LoaderOptions) {
  const roleService: IMedusaInternalService<typeof Role> = container.resolve("teamRoleService")

  const [existingRoles] = await roleService.listAndCount({}, { select: ["id", "key"] })
  const existingKeys = new Set(existingRoles.map((role: any) => role.key))

  const missingDefaults = DEFAULT_ROLE_DEFINITIONS.filter((role) => !existingKeys.has(role.key))

  if (!missingDefaults.length) {
    return
  }

  await roleService.create(missingDefaults as any)
}
