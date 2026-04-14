import { Module } from "@medusajs/framework/utils"
import FacebookCapiModuleService from "./service"
import { FACEBOOK_CAPI_MODULE } from "./constants"

export default Module(FACEBOOK_CAPI_MODULE, {
  service: FacebookCapiModuleService,
})

export { FACEBOOK_CAPI_MODULE }
