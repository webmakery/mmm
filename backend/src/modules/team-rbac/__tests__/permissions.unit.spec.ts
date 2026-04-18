import { MedusaError } from "@medusajs/framework/utils"
import { canAssignRole } from "../../../api/admin/rbac/utils/permissions"

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
})
