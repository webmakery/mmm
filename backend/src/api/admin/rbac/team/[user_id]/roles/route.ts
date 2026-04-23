import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../../../modules/team-rbac"
// Team RBAC service resolved from module interface
import TeamRbacModuleService from "../../../../../../modules/team-rbac/service"
import { canAssignRole, requirePermission } from "../../../utils/permissions"
import { PostAssignRolesSchema } from "../../../utils/schemas"

export async function POST(req: MedusaRequest<z.infer<typeof PostAssignRolesSchema>>, res: MedusaResponse) {
  const actor = await requirePermission(req, "team.manage")

  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)
  const roles = await rbacService.getRolesByIds(req.validatedBody.role_ids)

  if (roles.length !== req.validatedBody.role_ids.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "One or more roles are invalid")
  }

  roles.forEach((role) => canAssignRole(actor, role.key))

  const assigningSelf = actor.actorId === req.params.user_id
  if (assigningSelf && !roles.some((role) => role.permissions.includes("team.manage") || role.permissions.includes("*"))) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "You cannot remove your own team management access")
  }

  const assigned = await rbacService.assignRolesToUser(req.params.user_id, req.validatedBody.role_ids)

  res.json({ roles: assigned })
}
