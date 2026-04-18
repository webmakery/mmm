import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../../../../modules/team-rbac/service"
import { requirePermission } from "../../../../utils/permissions"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const actor = await requirePermission(req, "team.manage")
  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)

  const role = await rbacService.retrieveRole(req.params.role_id)

  if ((role as any).key === "super_admin") {
    const superAdminCount = await rbacService.countSuperAdmins()

    if (superAdminCount <= 1) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The last super admin cannot be removed")
    }
  }

  if (actor.actorId === req.params.user_id && (role as any).key === "super_admin") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "You cannot remove your own super admin role")
  }

  const nextRoles = await rbacService.removeRoleFromUser(req.params.user_id, req.params.role_id)

  res.json({ roles: nextRoles })
}
