import { Module } from "@medusajs/framework/utils"
import InboxModuleService from "./service"

export const INBOX_MODULE = "inbox"

export default Module(INBOX_MODULE, {
  service: InboxModuleService,
})
