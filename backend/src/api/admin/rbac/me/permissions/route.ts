import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../../modules/team-rbac/service"
import { requirePermission } from "../../utils/permissions"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const actor = await requirePermission(req, "permissions.read")
  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)
  const result = await rbacService.getActorPermissions(actor.actorId)

  res.json(result)
}
