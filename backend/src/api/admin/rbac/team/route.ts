import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { RBAC_MODULE } from "../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../modules/team-rbac/service"
import { requirePermission } from "../utils/permissions"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await requirePermission(req, "team.read")

  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)
  const [members, invites] = await Promise.all([
    rbacService.listTeamUsers(),
    rbacService.listPendingInvites(),
  ])

  res.json({ members, invites })
}
