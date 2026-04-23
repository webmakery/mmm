import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "@medusajs/framework/zod"
import { MedusaError } from "@medusajs/framework/utils"
import { RBAC_MODULE } from "../../../../modules/team-rbac"
// Team RBAC service resolved from module interface
import TeamRbacModuleService from "../../../../modules/team-rbac/service"
import { requirePermission } from "../utils/permissions"
import { PostCreateRoleSchema } from "../utils/schemas"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  await requirePermission(req, "roles.read")

  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)
  const roles = await rbacService.listRoles({}, { order: { created_at: "ASC" as const } })

  res.json({ roles })
}

export async function POST(req: MedusaRequest<z.infer<typeof PostCreateRoleSchema>>, res: MedusaResponse) {
  await requirePermission(req, "roles.manage")

  const parsedBody = PostCreateRoleSchema.safeParse(req.validatedBody ?? req.body ?? {})
  if (!parsedBody.success) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid role payload")
  }

  const payload = parsedBody.data
  const rbacService = req.scope.resolve<TeamRbacModuleService>(RBAC_MODULE)
  const existing = await rbacService.getRoleByKey(payload.key)

  if (existing) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "A role with this key already exists")
  }

  const role = await rbacService.createRoles(payload as any)
  res.status(201).json({ role })
}
