import { model } from "@medusajs/framework/utils"

export const CustomDomainStatuses = ["pending_dns", "active", "failed", "removed"] as const
export type CustomDomainStatus = (typeof CustomDomainStatuses)[number]

export const CustomDomainVerificationTypes = ["cname", "a_record"] as const
export type CustomDomainVerificationType = (typeof CustomDomainVerificationTypes)[number]

const CustomDomain = model.define("custom_domain", {
  id: model.id().primaryKey(),
  store_id: model.text(),
  domain: model.text(),
  target_host: model.text(),
  expected_value: model.text(),
  verification_type: model.enum([...CustomDomainVerificationTypes]).default("cname"),
  status: model.enum([...CustomDomainStatuses]).default("pending_dns"),
  last_checked_at: model.dateTime().nullable(),
  activated_at: model.dateTime().nullable(),
  failure_reason: model.text().nullable(),
})

export default CustomDomain
