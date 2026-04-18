import { MedusaRequest } from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../modules/team-rbac/service"

export type PermissionCheckResult = {
  actorId: string
  permissions: string[]
  roles: Array<{ id: string; key: string; name: string; permissions: string[] }>
  isSuperAdmin: boolean
}

export const requirePermission = async (
  req: MedusaRequest,
  requiredPermission: string
): Promise<PermissionCheckResult> => {
  const actorId = (req as any).auth_context?.actor_id

  if (!actorId) {
    throw new MedusaError(MedusaError.Types.UNAUTHORIZED, "Authentication is required")
  }

  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)
  const actor = await rbacService.getActorPermissions(actorId)

  if (actor.isSuperAdmin || actor.permissions.includes("*") || actor.permissions.includes(requiredPermission)) {
    return {
      actorId,
      permissions: actor.permissions,
      roles: actor.roles,
      isSuperAdmin: actor.isSuperAdmin,
    }
  }

  throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "You do not have permission to perform this action")
}

export const canAssignRole = (
  actor: Pick<PermissionCheckResult, "isSuperAdmin">,
  roleKey: string
) => {
  if (roleKey === "super_admin" && !actor.isSuperAdmin) {
    throw new MedusaError(MedusaError.Types.NOT_ALLOWED, "Only super admins can assign super admin role")
  }
}
