import { Context, IUserModuleService, InviteDTO, UserDTO } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaError, MedusaService, Modules } from "@medusajs/framework/utils"
import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import Role from "./models/role"
import UserRole from "./models/user-role"
import { DEFAULT_ROLE_DEFINITIONS, SUPER_ADMIN_KEY } from "./constants"

type RoleRecord = {
  id: string
  key: string
  name: string
  description?: string | null
  permissions: string[]
  is_system: boolean
}

type TeamUserFallbackRecord = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  roles: string[]
  assigned_roles: RoleRecord[]
  source: "local-mapping"
}

const normalizeRole = (role: any): RoleRecord => ({
  ...role,
  permissions: Array.isArray(role?.permissions) ? role.permissions : [],
})

const ADMIN_ROLE_KEY = "admin"

const normalizeRoleKeys = (roles: unknown): string[] =>
  [
    ...new Set(
      (Array.isArray(roles) ? roles : [])
        .filter((role): role is string => typeof role === "string")
        .map((role) => role.trim())
        .filter(Boolean)
    ),
  ]

const extractInviteRoleRefs = (invite: InviteDTO): string[] => {
  const metadata = (invite.metadata || {}) as Record<string, unknown>
  const rawRefs = [
    ...(Array.isArray((invite as any).roles) ? (invite as any).roles : []),
    ...(Array.isArray(metadata.role_ids) ? metadata.role_ids : []),
    ...(Array.isArray(metadata.roles) ? metadata.roles : []),
  ]

  return [
    ...new Set(
      rawRefs
        .map((ref) => {
          if (typeof ref === "string") {
            return ref.trim()
          }

          if (ref && typeof ref === "object" && "id" in ref && typeof (ref as any).id === "string") {
            return (ref as any).id.trim()
          }

          if (ref && typeof ref === "object" && "key" in ref && typeof (ref as any).key === "string") {
            return (ref as any).key.trim()
          }

          return ""
        })
        .filter(Boolean)
    ),
  ]
}

const isPendingInvite = (invite: any): boolean => {
  if (!invite) {
    return false
  }

  if (invite.deleted_at) {
    return false
  }

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

class TeamRbacModuleService extends MedusaService({
  Role,
  UserRole,
}) {
  private getContainer(): any {
    return (this as any).container || (this as any).__container__ || null
  }

  private getUserService(): IUserModuleService | null {
    const container = this.getContainer()

    const serviceKeys = [
      Modules.USER,
      (Modules as any).USERS,
      "user",
      "users",
      "userModuleService",
      "userService",
    ]

    for (const key of serviceKeys) {
      try {
        if (typeof container?.resolve === "function") {
          const service = container.resolve(key)
          if (service) {
            return service as IUserModuleService
          }
        } else if (container?.[key]) {
          return container[key] as IUserModuleService
        }
      } catch {
        continue
      }
    }

    return null
  }

  private requireUserService(): IUserModuleService {
    const userService = this.getUserService()

    if (!userService) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "User service is not available in the current container"
      )
    }

    return userService
  }

  private async resolveRolesByRefs(roleRefs: string[]): Promise<Map<string, RoleRecord>> {
    const uniqueRefs = [...new Set(roleRefs.filter(Boolean))]

    if (!uniqueRefs.length) {
      return new Map()
    }

    const [rolesById, rolesByKey] = await Promise.all([
      this.listRoles({ id: uniqueRefs as any }, { take: Math.max(200, uniqueRefs.length) }),
      this.listRoles({ key: uniqueRefs as any }, { take: Math.max(200, uniqueRefs.length) }),
    ])

    const resolved = new Map<string, RoleRecord>()

    for (const role of rolesById as any[]) {
      const normalized = normalizeRole(role)
      resolved.set(normalized.id, normalized)
    }

    for (const role of rolesByKey as any[]) {
      const normalized = normalizeRole(role)
      resolved.set(normalized.key, normalized)
    }

    return resolved
  }

  private async getAssignedRolesByUserId(): Promise<Map<string, RoleRecord[]>> {
    const mappings = await this.listUserRoles({}, { relations: ["role"], take: 5000 })
    const rolesByUserId = new Map<string, RoleRecord[]>()

    mappings.forEach((mapping: any) => {
      if (!mapping?.user_id || !mapping?.role) {
        return
      }

      const existing = rolesByUserId.get(mapping.user_id) || []
      existing.push(normalizeRole(mapping.role))
      rolesByUserId.set(mapping.user_id, existing)
    })

    return rolesByUserId
  }

  async attachRolesToInvites(invites: InviteDTO[]) {
    const inviteRoleRefsByInviteId = new Map(
      invites.map((invite: InviteDTO) => [invite.id, extractInviteRoleRefs(invite)])
    )

    const invitedRoleRefs = [...new Set(Array.from(inviteRoleRefsByInviteId.values()).flat())]
    const rolesByRef = await this.resolveRolesByRefs(invitedRoleRefs)

    return invites.map((invite: InviteDTO) => ({
      ...invite,
      assigned_roles: (inviteRoleRefsByInviteId.get(invite.id) || [])
        .map((roleRef) => rolesByRef.get(roleRef))
        .filter(Boolean),
    }))
  }

  async ensureDefaultRoles() {
    const existing = await this.listRoles(
      {},
      { select: ["id", "key", "name", "description", "permissions", "is_system"] }
    )
    const existingByKey = new Map(existing.map((role: any) => [role.key, normalizeRole(role)]))

    const toCreate = DEFAULT_ROLE_DEFINITIONS
      .filter((role) => !existingByKey.has(role.key))
      .map((role) => ({ ...role, permissions: [...role.permissions] }))

    if (toCreate.length) {
      await this.createRoles(toCreate as any[])
    }

    const toUpdate = DEFAULT_ROLE_DEFINITIONS
      .map((definition) => {
        const current = existingByKey.get(definition.key)

        if (!current) {
          return null
        }

        const currentPermissions = Array.isArray(current.permissions) ? [...current.permissions].sort() : []
        const expectedPermissions = [...definition.permissions].sort()
        const needsPermissionSync =
          currentPermissions.length !== expectedPermissions.length ||
          currentPermissions.some((permission, index) => permission !== expectedPermissions[index])

        if (
          current.name === definition.name &&
          (current.description ?? null) === (definition.description ?? null) &&
          current.is_system === definition.is_system &&
          !needsPermissionSync
        ) {
          return null
        }

        return {
          id: current.id,
          name: definition.name,
          description: definition.description ?? null,
          permissions: [...definition.permissions],
          is_system: definition.is_system,
        }
      })
      .filter(Boolean)

    if (toUpdate.length) {
      await this.updateRoles(toUpdate as any[])
    }
  }

  async getRolesByIds(ids: string[]) {
    if (!ids.length) {
      return [] as RoleRecord[]
    }

    const roles = await this.listRoles({ id: ids as any }, { take: 100, relations: [] })
    return roles.map(normalizeRole) as RoleRecord[]
  }

  async listRbacRoles(filters: Record<string, any> = {}, config: Record<string, any> = {}) {
    const roles = await this.listRoles(filters as any, config as any)
    return roles.map((role: any) => normalizeRole(role))
  }

  async getRoleByKey(key: string) {
    const [role] = await this.listRoles({ key }, { take: 1 })
    return role ? normalizeRole(role as any) : null
  }

  async getActorRoles(actorId: string) {
    await this.ensureDefaultRoles()

    const userService = this.getUserService()

    if (!userService) {
      const mappings = await this.listUserRoles({ user_id: actorId }, { relations: ["role"] })

      if (!mappings.length) {
        const superAdminCount = await this.countSuperAdmins()
        const baselineRoleKey = superAdminCount === 0 ? SUPER_ADMIN_KEY : ADMIN_ROLE_KEY
        const baselineRole = await this.getRoleByKey(baselineRoleKey)

        if (baselineRole) {
          await this.createUserRoles({ user_id: actorId, role_id: baselineRole.id } as any)
          return [baselineRole]
        }
      }

      return mappings.map((mapping: any) => mapping.role).filter(Boolean) as RoleRecord[]
    }

    const user = await userService.retrieveUser(actorId).catch(() => null)

    if (!user) {
      return [] as RoleRecord[]
    }

    await this.bootstrapActorIfNeeded(user.id)

    const userRoleKeys = normalizeRoleKeys((user as any).roles)
    const definedRoles = userRoleKeys.length
      ? await this.listRoles({ key: userRoleKeys as any }, { take: userRoleKeys.length })
      : []

    const resolvedRoleKeys = await this.ensureActorHasBaselineRole(
      user.id,
      normalizeRoleKeys(definedRoles.map((role: any) => role.key))
    )

    await this.syncUserRoleMappings({ id: user.id, roles: resolvedRoleKeys })

    const mappings = await this.listUserRoles({ user_id: actorId }, { relations: ["role"] })

    return mappings.map((mapping: any) => mapping.role).filter(Boolean) as RoleRecord[]
  }

  async getActorPermissions(actorId: string) {
    const roles = await this.getActorRoles(actorId)
    const permissions = new Set<string>()

    roles.forEach((role) => {
      role.permissions?.forEach((permission) => permissions.add(permission))
    })

    return {
      roles,
      permissions: Array.from(permissions),
      isSuperAdmin: roles.some((role) => role.key === SUPER_ADMIN_KEY),
    }
  }

  async syncUserRoleMappings(user: Pick<UserDTO, "id" | "roles">) {
    const roleKeys = normalizeRoleKeys(user.roles)

    const currentMappings = await this.listUserRoles({ user_id: user.id }, { relations: ["role"] })

    if (!roleKeys.length) {
      const staleIds = currentMappings.map((mapping: any) => mapping.id)
      if (staleIds.length) {
        await this.deleteUserRoles(staleIds)
      }
      return
    }

    const roles = await this.listRoles({ key: roleKeys as any }, { take: roleKeys.length })
    const roleByKey = new Map(roles.map((role: any) => [role.key, normalizeRole(role)]))
    const resolvedRoleKeys = roleKeys.filter((key) => roleByKey.has(key))

    const mappedKeys = new Set(currentMappings.map((mapping: any) => mapping.role?.key).filter(Boolean))

    const toCreate = resolvedRoleKeys
      .filter((key) => !mappedKeys.has(key))
      .map((key) => ({ user_id: user.id, role_id: roleByKey.get(key)!.id }))

    if (toCreate.length) {
      await this.createUserRoles(toCreate as any[])
    }

    const staleIds = currentMappings
      .filter((mapping: any) => mapping.role?.key && !resolvedRoleKeys.includes(mapping.role.key))
      .map((mapping: any) => mapping.id)

    if (staleIds.length) {
      await this.deleteUserRoles(staleIds)
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[]) {
    await this.ensureDefaultRoles()

    const roles = await this.getRolesByIds(roleIds)

    if (roles.length !== roleIds.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "One or more roles are invalid")
    }

    const userService = this.getUserService()

    if (userService) {
      const user = await userService.retrieveUser(userId).catch(() => null)

      if (!user) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "User not found")
      }

      await userService.updateUsers({
        id: user.id,
        roles: roles.map((role) => role.key),
      })

      await this.syncUserRoleMappings({ id: user.id, roles: roles.map((role) => role.key) })
      return roles
    }

    const currentMappings = await this.listUserRoles({ user_id: userId }, { relations: ["role"] })
    if (currentMappings.length) {
      await this.deleteUserRoles(currentMappings.map((mapping: any) => mapping.id))
    }

    if (roles.length) {
      await this.createUserRoles(
        roles.map((role) => ({
          user_id: userId,
          role_id: role.id,
        })) as any[]
      )
    }

    return roles
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const role = await this.retrieveRole(roleId).catch(() => null)

    if (!role) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Role not found")
    }

    const userService = this.getUserService()

    if (userService) {
      const user = await userService.retrieveUser(userId).catch(() => null)

      if (!user) {
        throw new MedusaError(MedusaError.Types.NOT_FOUND, "User not found")
      }

      const nextRoles = ((user as any).roles || []).filter((key: string) => key !== (role as any).key)

      await userService.updateUsers({
        id: user.id,
        roles: nextRoles,
      })

      await this.syncUserRoleMappings({ id: user.id, roles: nextRoles })
      return nextRoles
    }

    const staleMappings = await this.listUserRoles({ user_id: userId, role_id: roleId }, { take: 100 })
    if (staleMappings.length) {
      await this.deleteUserRoles(staleMappings.map((mapping: any) => mapping.id))
    }

    const remainingMappings = await this.listUserRoles({ user_id: userId }, { relations: ["role"], take: 100 })
    return remainingMappings.map((mapping: any) => mapping.role?.key).filter(Boolean)
  }

  async listTeamUsers() {
    await this.ensureDefaultRoles()

    const userService = this.getUserService()
    const rolesByUserId = await this.getAssignedRolesByUserId()

    if (!userService) {
      const fallbackUsers: TeamUserFallbackRecord[] = Array.from(rolesByUserId.entries()).map(
        ([userId, assignedRoles]) => ({
          id: userId,
          email: null,
          first_name: null,
          last_name: null,
          roles: assignedRoles.map((role) => role.key),
          assigned_roles: assignedRoles,
          source: "local-mapping",
        })
      )

      return fallbackUsers
    }

    const [users] = await userService.listAndCountUsers({}, { take: 200 })

    await Promise.all(
      users.map(async (user) => {
        const normalizedRoles = normalizeRoleKeys((user as any).roles)
        await this.syncUserRoleMappings({
          id: user.id,
          roles: normalizedRoles,
        })
      })
    )

    const freshRolesByUserId = await this.getAssignedRolesByUserId()

    return users.map((user) => ({
      ...user,
      assigned_roles: freshRolesByUserId.get(user.id) || [],
    }))
  }

  async listPendingInvites() {
    const userService = this.getUserService()

    if (!userService) {
      console.log("[team-rbac] listPendingInvites: userService unavailable")
      return []
    }

    const [allInvites] = await userService.listAndCountInvites({} as any, { take: 200 })
    const invites = (allInvites || []).filter(isPendingInvite)

    return this.attachRolesToInvites(invites as InviteDTO[])
  }

  async countSuperAdmins() {
    const superAdminRole = await this.getRoleByKey(SUPER_ADMIN_KEY)

    if (!superAdminRole) {
      return 0
    }

    const [mappings] = await this.listAndCountUserRoles({ role_id: superAdminRole.id }, {})
    return mappings.length
  }

  async bootstrapActorIfNeeded(actorId: string) {
    const existingMappings = await this.listUserRoles({ user_id: actorId }, { take: 1 })
    if (existingMappings.length) {
      return
    }

    const role = await this.getRoleByKey(SUPER_ADMIN_KEY)
    if (!role) {
      return
    }

    const userService = this.getUserService()
    if (!userService) {
      return
    }

    const user = await userService.retrieveUser(actorId).catch(() => null)
    if (!user) {
      return
    }

    const nextRoles = [...new Set([...(((user as any).roles || []) as string[]), SUPER_ADMIN_KEY])]
    await userService.updateUsers({ id: user.id, roles: nextRoles })
    await this.createUserRoles({ user_id: user.id, role_id: role.id } as any)
  }

  async ensureActorHasBaselineRole(actorId: string, existingRoleKeys: string[]) {
    if (existingRoleKeys.length) {
      return existingRoleKeys
    }

    const userService = this.getUserService()
    if (!userService) {
      return existingRoleKeys
    }

    const superAdminCount = await this.countSuperAdmins()
    const baselineRoleKey = superAdminCount === 0 ? SUPER_ADMIN_KEY : ADMIN_ROLE_KEY
    const nextRoles = [baselineRoleKey]

    await userService.updateUsers({ id: actorId, roles: nextRoles })
    return nextRoles
  }

  @InjectManager()
  async deleteRoleWithChecks(
    roleId: string,
    actorId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const role = (await this.retrieveRole(roleId)) as any as RoleRecord

    if (role.key === SUPER_ADMIN_KEY) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Super admin role cannot be deleted")
    }

    const roleMappings = await this.listUserRoles({ role_id: roleId }, {}, sharedContext)

    if (roleMappings.some((mapping: any) => mapping.user_id === actorId)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "You cannot delete a role assigned to yourself")
    }

    if (roleMappings.length) {
      await this.deleteUserRoles(
        roleMappings.map((mapping: any) => mapping.id),
        sharedContext
      )
    }

    await this.deleteRoles(roleId, sharedContext)
  }
}

export default TeamRbacModuleService
