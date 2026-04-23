import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { createInvitesWorkflow } from "@medusajs/medusa/core-flows"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../../modules/team-rbac"
// Team RBAC service resolved from module interface
import TeamRbacModuleService from "../../../../../modules/team-rbac/service"
import { canAssignRole, requirePermission } from "../../utils/permissions"
import { PostInviteWithRolesSchema } from "../../utils/schemas"

export async function POST(
  req: MedusaRequest<z.infer<typeof PostInviteWithRolesSchema>>,
  res: MedusaResponse
) {
  const actor = await requirePermission(req, "team.manage")
  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)

  const roles = await rbacService.getRolesByIds(req.validatedBody.role_ids)

  if (roles.length !== req.validatedBody.role_ids.length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "One or more roles are invalid")
  }

  roles.forEach((role) => canAssignRole(actor, role.key))

  const { result } = await createInvitesWorkflow(req.scope).run({
    input: {
      invites: [
        {
          email: req.validatedBody.email,
          roles: roles.map((role) => role.id),
        },
      ],
    },
  })

  res.status(201).json({ invite: result[0] })
}
