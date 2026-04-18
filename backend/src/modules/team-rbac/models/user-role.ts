import { model } from "@medusajs/framework/utils"
import Role from "./role"

const UserRole = model.define("team_user_role", {
  id: model.id().primaryKey(),
  user_id: model.text().index("IDX_TEAM_USER_ROLE_USER_ID"),
  role: model.belongsTo(() => Role, {
    mappedBy: "user_roles",
  }),
})

export default UserRole
