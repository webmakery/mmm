export const RBAC_MODULE = "team_rbac"

export const DEFAULT_ROLE_DEFINITIONS = [
  {
    key: "super_admin",
    name: "Super Admin",
    description: "Full administrative access.",
    permissions: ["*"],
    is_system: true,
  },
  {
    key: "admin",
    name: "Admin",
    description: "Can manage team members and roles.",
    permissions: ["team.read", "team.manage", "roles.read", "roles.manage", "permissions.read"],
    is_system: true,
  },
  {
    key: "editor",
    name: "Editor",
    description: "Can view team members and role definitions.",
    permissions: ["team.read", "roles.read", "permissions.read"],
    is_system: true,
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access.",
    permissions: ["permissions.read"],
    is_system: true,
  },
] as const

export const SUPER_ADMIN_KEY = "super_admin"
