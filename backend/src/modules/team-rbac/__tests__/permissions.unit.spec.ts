import { MedusaError } from "@medusajs/framework/utils"
import { canAssignRole, requirePermission } from "../../../api/admin/rbac/utils/permissions"
import { RBAC_MODULE } from "../../team-rbac"

describe("RBAC permission helper", () => {
  it("allows super admins to assign super_admin role", () => {
    expect(() => canAssignRole({ isSuperAdmin: true }, "super_admin")).not.toThrow()
  })

  it("rejects assigning super_admin for non super admins", () => {
    expect(() => canAssignRole({ isSuperAdmin: false }, "super_admin")).toThrow(MedusaError)
  })

  it("allows assigning non-super-admin roles", () => {
    expect(() => canAssignRole({ isSuperAdmin: false }, "viewer")).not.toThrow()
  })

  it("resolves the actor id from app metadata for admin users", async () => {
    const getActorPermissions = jest.fn().mockResolvedValue({
      permissions: ["roles.read"],
      roles: [],
      isSuperAdmin: false,
    })

    const req = {
      auth_context: {
        actor_type: "user",
        actor_id: "auth_identity_123",
        app_metadata: {
          user_id: "user_123",
        },
      },
      scope: {
        resolve: (key: string) => {
          if (key === RBAC_MODULE) {
            return { getActorPermissions }
          }

          return null
        },
      },
    } as any

    const result = await requirePermission(req, "roles.read")

    expect(getActorPermissions).toHaveBeenCalledWith("user_123")
    expect(result.actorId).toBe("user_123")
  })

  it("falls back to actor_id when app metadata user_id is unavailable", async () => {
    const getActorPermissions = jest.fn().mockResolvedValue({
      permissions: ["roles.read"],
      roles: [],
      isSuperAdmin: false,
    })

    const req = {
      auth_context: {
        actor_type: "user",
        actor_id: "user_456",
        app_metadata: {},
      },
      scope: {
        resolve: () => ({ getActorPermissions }),
      },
    } as any

    const result = await requirePermission(req, "roles.read")

    expect(getActorPermissions).toHaveBeenCalledWith("user_456")
    expect(result.actorId).toBe("user_456")
  })
})
