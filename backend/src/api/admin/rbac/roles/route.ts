import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../modules/team-rbac"
import TeamRbacModuleService from "../../../../modules/team-rbac/service"
import { requirePermission } from "../utils/permissions"
import { PostCreateRoleSchema } from "../utils/schemas"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await requirePermission(req, "roles.read")

  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)
  const roles = await rbacService.listRoles({}, { order: { created_at: "ASC" as const } })

  res.json({ roles })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostCreateRoleSchema>>, res: MedusaResponse) {
  await requirePermission(req, "roles.manage")

  const rbacService: TeamRbacModuleService = req.scope.resolve(RBAC_MODULE)
  const existing = await rbacService.getRoleByKey(req.validatedBody.key)

  if (existing) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "A role with this key already exists")
  }

  const role = await rbacService.createRoles(req.validatedBody as any)
  res.status(201).json({ role })
}
