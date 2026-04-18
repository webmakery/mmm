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

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.setHeader("Surrogate-Control", "no-store")

  return res.status(200).json({ members, invites })
}
