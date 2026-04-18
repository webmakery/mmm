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

class TeamRbacModuleService extends MedusaService({
  Role,
  UserRole,
}) {
  private getUserService(): IUserModuleService {
    return (this as any).__container__[Modules.USER]
  }

  async ensureDefaultRoles() {
    const existing = await this.listRoles({}, { select: ["id", "key"] })
    const keys = new Set(existing.map((role) => role.key))

    const toCreate = DEFAULT_ROLE_DEFINITIONS.filter((role) => !keys.has(role.key))
    if (toCreate.length) {
      await this.createRoles(toCreate as any[])
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
    const user = await userService.retrieveUser(actorId).catch(() => null)

    if (!user) {
      return [] as RoleRecord[]
    }

    await this.bootstrapActorIfNeeded(user.id)
    await this.syncUserRoleMappings(user)

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
    const roleKeys = [...new Set((user.roles || []).filter(Boolean))]

    if (!roleKeys.length) {
      return
    }

    const roles = await this.listRoles({ key: roleKeys as any }, { take: roleKeys.length })
    const roleByKey = new Map(roles.map((role: any) => [role.key, normalizeRole(role)]))

    const missingRoleDefinitions = roleKeys.filter((key) => !roleByKey.has(key))
    if (missingRoleDefinitions.length) {
      await this.createRoles(
        missingRoleDefinitions.map((key) => ({
          key,
          name: key,
          description: null,
          permissions: [],
          is_system: false,
        })) as any[]
      )

      const refreshedRoles = await this.listRoles({ key: roleKeys as any }, { take: roleKeys.length })
      refreshedRoles.forEach((role: any) => roleByKey.set(role.key, normalizeRole(role)))
    }

    const currentMappings = await this.listUserRoles({ user_id: user.id }, { relations: ["role"] })
    const mappedKeys = new Set(currentMappings.map((mapping: any) => mapping.role?.key).filter(Boolean))

    const toCreate = roleKeys
      .filter((key) => !mappedKeys.has(key))
      .map((key) => ({ user_id: user.id, role_id: roleByKey.get(key)!.id }))

    if (toCreate.length) {
      await this.createUserRoles(toCreate as any[])
    }

    const staleIds = currentMappings
      .filter((mapping: any) => mapping.role?.key && !roleKeys.includes(mapping.role.key))
      .map((mapping: any) => mapping.id)

    if (staleIds.length) {
      await this.deleteUserRoles(staleIds)
    }
  }

  async assignRolesToUser(userId: string, roleIds: string[]) {
    const userService = this.getUserService()
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
    const userService = this.getUserService()
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
    const userService = this.getUserService()
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
    const userService = this.getUserService()
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
    const user = await userService.retrieveUser(actorId).catch(() => null)
    if (!user) {
      return
    }

    const nextRoles = [...new Set([...(user.roles || []), SUPER_ADMIN_KEY])]
    await userService.updateUsers({ id: user.id, roles: nextRoles })
    await this.createUserRoles({ user_id: user.id, role_id: role.id } as any)
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
