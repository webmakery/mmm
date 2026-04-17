import { Module } from "@medusajs/framework/utils"
import seedDefaultLeadStages from "./loaders/seed-default-stages"
import LeadModuleService from "./service"

export const LEAD_MODULE = "lead"

export default Module(LEAD_MODULE, {
  service: LeadModuleService,
  loaders: [seedDefaultLeadStages],
})
