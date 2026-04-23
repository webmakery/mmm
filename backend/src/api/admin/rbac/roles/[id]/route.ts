import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../../modules/team-rbac"
// Team RBAC service resolved from module interface
import TeamRbacModuleService from "../../../../../modules/team-rbac/service"
import { requirePermission } from "../../utils/permissions"
import { PostUpdateRoleSchema } from "../../utils/schemas"

export async function POST(req: MedusaRequest<z.infer<typeof PostUpdateRoleSchema>>, res: MedusaResponse) {
  await requirePermission(req, "roles.manage")

  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)
  const role = await rbacService.retrieveRole(req.params.id)

  if ((role as any).key === "super_admin" && req.validatedBody.permissions && !req.validatedBody.permissions.includes("*")) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Super admin role must retain wildcard permission")
  }

  const updated = await rbacService.updateRoles({
    id: req.params.id,
    ...req.validatedBody,
  } as any)

  res.json({ role: updated })
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const actor = await requirePermission(req, "roles.manage")

  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)
  await rbacService.deleteRoleWithChecks(req.params.id, actor.actorId)

  res.json({ id: req.params.id, object: "role", deleted: true })
}
