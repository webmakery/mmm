import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CUSTOM_DOMAIN_MODULE } from "../modules/custom-domain"
import type CustomDomainModuleService from "../modules/custom-domain/service"
import type { CustomDomainStatus, CustomDomainVerificationType } from "../modules/custom-domain/models/custom-domain"
import { DomainValidationError, normalizeDomain } from "./custom-domains/domain-validation"
import { verifyDomainDns } from "./custom-domains/dns-verification"

export type DnsInstructions = {
  type: "CNAME" | "A"
  name: string
  value: string
  note: string
}

export type CustomDomainRecord = {
  id: string
  store_id: string
  domain: string
  target_host: string
  expected_value: string
  verification_type: CustomDomainVerificationType
  status: CustomDomainStatus
  last_checked_at: Date | null
  activated_at: Date | null
  failure_reason: string | null
  created_at: Date
  updated_at: Date
}

export class CustomDomainService {
  constructor(private readonly container: any) {}

  private get moduleService(): CustomDomainModuleService {
    return this.container.resolve(CUSTOM_DOMAIN_MODULE)
  }

  private async getDefaultStoreId(): Promise<string> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "store", fields: ["id"], pagination: { take: 1, skip: 0 } })

    if (!data?.length) {
      throw new Error("No store found for custom domain association")
    }

    return data[0].id
  }

  private getConfig(): { targetHost: string; targetIp: string | null; verificationType: CustomDomainVerificationType } {
    const targetHost = (process.env.PLATFORM_DOMAIN_TARGET_HOST || "").trim().toLowerCase()
    const targetIp = (process.env.VPS_PUBLIC_IP || "").trim()

    if (!targetHost) {
      throw new Error("PLATFORM_DOMAIN_TARGET_HOST must be configured")
    }

    return {
      targetHost,
      targetIp: targetIp || null,
      verificationType: "cname",
    }
  }

  private buildInstructions(domain: string, expectedValue: string, verificationType: CustomDomainVerificationType): DnsInstructions {
    if (verificationType === "a_record") {
      return {
        type: "A",
        name: domain,
        value: expectedValue,
        note: "Create an A record pointing to your VPS public IP.",
      }
    }

    return {
      type: "CNAME",
      name: domain,
      value: expectedValue,
      note: "Create a CNAME record pointing your custom domain to your assigned platform hostname.",
    }
  }

  async createDomain(input: { domain: string }): Promise<{ domain: CustomDomainRecord; dns_instructions: DnsInstructions }> {
    const normalizedDomain = normalizeDomain(input.domain)
    const storeId = await this.getDefaultStoreId()
    const config = this.getConfig()
    const existing = await this.moduleService.listCustomDomains({ domain: normalizedDomain })

    if (existing.length) {
      throw new Error("Domain already exists")
    }

    const created = await this.moduleService.createCustomDomains({
      store_id: storeId,
      domain: normalizedDomain,
      target_host: config.targetHost,
      expected_value:
        config.verificationType === "cname"
          ? config.targetHost
          : config.targetIp ?? "",
      verification_type: config.verificationType,
      status: "pending_dns",
      failure_reason: null,
    })

    return {
      domain: created as CustomDomainRecord,
      dns_instructions: this.buildInstructions(normalizedDomain, created.expected_value, created.verification_type),
    }
  }

  async listDomains(): Promise<CustomDomainRecord[]> {
    const storeId = await this.getDefaultStoreId()

    return (await this.moduleService.listCustomDomains({ store_id: storeId }, { order: { created_at: "DESC" } })) as CustomDomainRecord[]
  }

  async markRemoved(id: string): Promise<CustomDomainRecord> {
    const storeId = await this.getDefaultStoreId()
    const domain = await this.requireDomain(id, storeId)

    return (await this.moduleService.updateCustomDomains({
      id: domain.id,
      status: "removed",
      failure_reason: null,
    })) as CustomDomainRecord
  }

  async verifyDomain(id: string): Promise<CustomDomainRecord> {
    const storeId = await this.getDefaultStoreId()
    const domain = await this.requireDomain(id, storeId)

    return this.verifyAndPersist(domain)
  }

  async verifyPendingDomains(limit = 50): Promise<number> {
    const candidates = (await this.moduleService.listCustomDomains(
      { status: ["pending_dns", "failed"] },
      { take: limit, order: { updated_at: "ASC" } }
    )) as CustomDomainRecord[]

    for (const candidate of candidates) {
      await this.verifyAndPersist(candidate)
    }

    return candidates.length
  }

  async canIssueCertificate(domainInput: string): Promise<boolean> {
    let normalizedDomain: string

    try {
      normalizedDomain = normalizeDomain(domainInput)
    } catch {
      return false
    }

    const records = (await this.moduleService.listCustomDomains({ domain: normalizedDomain })) as CustomDomainRecord[]

    if (!records.length) {
      return false
    }

    const record = records[0]

    return record.status === "active"
  }

  async validateDomainInput(domain: string): Promise<string> {
    try {
      return normalizeDomain(domain)
    } catch (error) {
      if (error instanceof DomainValidationError) {
        throw error
      }

      throw new Error("Invalid domain")
    }
  }

  private async requireDomain(id: string, storeId: string): Promise<CustomDomainRecord> {
    const domains = (await this.moduleService.listCustomDomains({ id, store_id: storeId })) as CustomDomainRecord[]

    if (!domains.length) {
      throw new Error("Domain not found")
    }

    return domains[0]
  }

  private async verifyAndPersist(domain: CustomDomainRecord): Promise<CustomDomainRecord> {
    const result = await verifyDomainDns({
      domain: domain.domain,
      verificationType: domain.verification_type,
      expectedValue: domain.expected_value,
    })

    return (await this.moduleService.updateCustomDomains({
      id: domain.id,
      status: result.isValid ? "active" : "failed",
      failure_reason: result.reason,
      last_checked_at: new Date(),
      activated_at: result.isValid ? new Date() : null,
    })) as CustomDomainRecord
  }
}

export default CustomDomainService
