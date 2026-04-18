import { model } from "@medusajs/framework/utils"
import UserRole from "./user-role"

const Role = model.define("team_role", {
  id: model.id().primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  description: model.text().nullable(),
  permissions: model.json().nullable(),
  is_system: model.boolean().default(false),
  user_roles: model.hasMany(() => UserRole, {
    mappedBy: "role",
  }),
})

export default Role
