import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import { InviteDTO, IUserModuleService } from "@medusajs/framework/types"
import { RBAC_MODULE } from "../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../modules/team-rbac/service"
import { requirePermission } from "../utils/permissions"

const isPendingInvite = (invite: any): boolean => {
  if (!invite) return false
  if (invite.deleted_at) return false

  if (
    invite.accepted ||
    invite.accepted_at ||
    invite.acceptedAt ||
    invite.accepted_by ||
    invite.acceptedBy
  ) {
    return false
  }

  const status = typeof invite.status === "string" ? invite.status.toLowerCase().trim() : ""
  const state = typeof invite.state === "string" ? invite.state.toLowerCase().trim() : ""

  if (["accepted", "revoked", "deleted", "expired", "cancelled", "canceled"].includes(status)) {
    return false
  }

  if (["accepted", "revoked", "deleted", "expired", "cancelled", "canceled"].includes(state)) {
    return false
  }

  return true
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await requirePermission(req, "team.read")

  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)

  let invites: InviteDTO[] = []

  try {
    const userService: IUserModuleService = req.scope.resolve(Modules.USER)
    const [allInvites] = await userService.listAndCountInvites({} as any, { take: 200 })
    invites = await rbacService.attachRolesToInvites((allInvites || []).filter(isPendingInvite) as InviteDTO[])
  } catch (e) {
    console.log("[team-route] failed to resolve/read invites from user service", e)
    invites = []
  }

  const members = await rbacService.listTeamUsers()

  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  res.setHeader("Pragma", "no-cache")
  res.setHeader("Expires", "0")
  res.setHeader("Surrogate-Control", "no-store")

  console.log("[team-route] invites payload", JSON.stringify(invites, null, 2))

  return res.status(200).json({ members, invites })
}
