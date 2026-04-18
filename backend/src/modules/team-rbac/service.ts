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


const normalizeRole = (role: any): RoleRecord => ({
  ...role,
  permissions: Array.isArray(role?.permissions) ? role.permissions : [],
})

const ADMIN_ROLE_KEY = "admin"
const normalizeRoleKeys = (roles: unknown): string[] =>
  [...new Set((Array.isArray(roles) ? roles : [])
    .filter((role): role is string => typeof role === "string")
    .map((role) => role.trim())
    .filter(Boolean))]

class TeamRbacModuleService extends MedusaService({
  Role,
  UserRole,
}) {
  private getUserService(): IUserModuleService | null {
    const container = (this as any).__container__

    const serviceKeys = [Modules.USER, "userModuleService", "userService"]

    for (const key of serviceKeys) {
      try {
        if (typeof container?.resolve === "function") {
          const service = container.resolve(key)
          if (service) {
            return service
          }
        } else if (container?.[key]) {
          return container[key]
        }
      } catch (e) {
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

  async ensureDefaultRoles() {
    const existing = await this.listRoles({}, { select: ["id", "key", "name", "description", "permissions", "is_system"] })
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

  async getRoleByKey(key: string) {
    const [role] = await this.listRoles({ key }, { take: 1 })
    return role ? normalizeRole(role as any) : null
  }

  async getActorRoles(actorId: string) {
    await this.ensureDefaultRoles()

    const userService = this.getUserService()
    if (!userService) {
      const mappings = await this.listUserRoles({ user_id: actorId }, { relations: ["role"] })

      return mappings
        .map((mapping: any) => mapping.role)
        .filter(Boolean) as RoleRecord[]
    }

    const user = await userService.retrieveUser(actorId).catch(() => null)

    if (!user) {
      return [] as RoleRecord[]
    }

    await this.bootstrapActorIfNeeded(user.id)
    const userRoleKeys = normalizeRoleKeys(user.roles)
    const definedRoles = userRoleKeys.length
      ? await this.listRoles({ key: userRoleKeys as any }, { take: userRoleKeys.length })
      : []
    const resolvedRoleKeys = await this.ensureActorHasBaselineRole(
      user.id,
      normalizeRoleKeys(definedRoles.map((role: any) => role.key))
    )
    await this.syncUserRoleMappings({ id: user.id, roles: resolvedRoleKeys })

    const mappings = await this.listUserRoles({ user_id: actorId }, { relations: ["role"] })

    return mappings
      .map((mapping: any) => mapping.role)
      .filter(Boolean) as RoleRecord[]
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

    if (!roleKeys.length) {
      return
    }

    const roles = await this.listRoles({ key: roleKeys as any }, { take: roleKeys.length })
    const roleByKey = new Map(roles.map((role: any) => [role.key, normalizeRole(role)]))
    const resolvedRoleKeys = roleKeys.filter((key) => roleByKey.has(key))

    const currentMappings = await this.listUserRoles({ user_id: user.id }, { relations: ["role"] })
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
    const userService = this.requireUserService()
    const user = await userService.retrieveUser(userId)
    const roles = await this.getRolesByIds(roleIds)

    if (roles.length !== roleIds.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "One or more roles are invalid")
    }

    await userService.updateUsers({
      id: user.id,
      roles: roles.map((role) => role.key),
    })

    await this.syncUserRoleMappings({ id: user.id, roles: roles.map((role) => role.key) })

    return roles
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    const userService = this.requireUserService()
    const user = await userService.retrieveUser(userId)
    const role = await this.retrieveRole(roleId).catch(() => null)

    if (!role) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Role not found")
    }

    const nextRoles = (user.roles || []).filter((key) => key !== role.key)

    await userService.updateUsers({
      id: user.id,
      roles: nextRoles,
    })

    await this.syncUserRoleMappings({ id: user.id, roles: nextRoles })

    return nextRoles
  }

  async listTeamUsers() {
    const userService = this.requireUserService()
    const [users] = await userService.listAndCountUsers({}, { take: 200 })

    await Promise.all(users.map((user) => this.syncUserRoleMappings(user)))

    const mappings = await this.listUserRoles({}, { relations: ["role"], take: 1000 })
    const rolesByUserId = new Map<string, RoleRecord[]>()

    mappings.forEach((mapping: any) => {
      if (!mapping.role) {
        return
      }

      const existing = rolesByUserId.get(mapping.user_id) || []
      existing.push(mapping.role)
      rolesByUserId.set(mapping.user_id, existing)
    })

    return users.map((user) => ({
      ...user,
      assigned_roles: rolesByUserId.get(user.id) || [],
    }))
  }

  async listPendingInvites() {
    const userService = this.requireUserService()
    const [allInvites] = await userService.listAndCountInvites({} as any, { take: 200 })
    const invites = allInvites.filter((invite) => !invite.accepted)

    const roles = await this.listRoles({ key: invites.flatMap((invite) => invite.roles || []) as any }, { take: 200 })
    const roleByKey = new Map(roles.map((role: any) => [role.key, normalizeRole(role)]))

    return invites.map((invite: InviteDTO) => ({
      ...invite,
      assigned_roles: (invite.roles || []).map((key) => roleByKey.get(key)).filter(Boolean),
    }))
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
    const existingMappings = await this.listUserRoles({}, { take: 1 })
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

    const nextRoles = [...new Set([...(user.roles || []), SUPER_ADMIN_KEY])]
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
      await this.deleteUserRoles(roleMappings.map((mapping: any) => mapping.id), sharedContext)
    }

    await this.deleteRoles(roleId, sharedContext)
  }
}

export default TeamRbacModuleService
