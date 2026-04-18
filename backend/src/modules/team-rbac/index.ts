import { Module } from "@medusajs/framework/utils"
import TeamRbacModuleService from "./service"
import { RBAC_MODULE } from "./constants"
import seedDefaultRoles from "./loaders/seed-default-roles"

export { RBAC_MODULE }

export default Module(RBAC_MODULE, {
  service: TeamRbacModuleService,
  loaders: [seedDefaultRoles],
})
