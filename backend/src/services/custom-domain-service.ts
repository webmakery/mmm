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
  ttl?: string
}

export type DomainDnsDetails = {
  dns_record_type: "cname" | "a_record"
  dns_host: string
  dns_value: string
  target_ip: string | null
  target_host: string
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

export type CustomDomainRecordWithDnsDetails = CustomDomainRecord & DomainDnsDetails

export class CustomDomainService {
  constructor(private readonly container: any) {}

  private get moduleService(): CustomDomainModuleService {
    return this.container.resolve(CUSTOM_DOMAIN_MODULE)
  }

  private async getDefaultStore(): Promise<{ id: string; metadata: Record<string, unknown> | null }> {
    const query = this.container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({
      entity: "store",
      fields: ["id", "metadata"],
      pagination: { take: 1, skip: 0 },
    })

    if (!data?.length) {
      throw new Error("No store found for custom domain association")
    }

    return {
      id: data[0].id,
      metadata: (data[0].metadata as Record<string, unknown> | null) ?? null,
    }
  }

  private pickString(value: unknown): string | null {
    if (typeof value !== "string") {
      return null
    }

    const trimmed = value.trim()

    return trimmed ? trimmed : null
  }

  private getConfig(storeMetadata: Record<string, unknown> | null): { targetHost: string; targetIp: string | null } {
    const metadataTargetHost =
      this.pickString(storeMetadata?.custom_domain_target_host) ||
      this.pickString(storeMetadata?.domain_target_host) ||
      this.pickString(storeMetadata?.instance_host)
    const metadataTargetIp =
      this.pickString(storeMetadata?.custom_domain_target_ip) ||
      this.pickString(storeMetadata?.domain_target_ip) ||
      this.pickString(storeMetadata?.instance_ip)

    const targetHost =
      metadataTargetHost ||
      this.pickString(process.env.CUSTOM_DOMAIN_TARGET_HOST) ||
      this.pickString(process.env.PLATFORM_DOMAIN_TARGET_HOST)
    const targetIp =
      metadataTargetIp ||
      this.pickString(process.env.CUSTOM_DOMAIN_TARGET_IP) ||
      this.pickString(process.env.VPS_PUBLIC_IP)

    if (!targetHost) {
      throw new Error("PLATFORM_DOMAIN_TARGET_HOST must be configured")
    }

    return {
      targetHost: targetHost.toLowerCase(),
      targetIp,
    }
  }

  private isApexDomain(domain: string): boolean {
    return domain.split(".").filter(Boolean).length === 2
  }

  private resolveVerificationType(domain: string, targetIp: string | null): CustomDomainVerificationType {
    if (this.isApexDomain(domain) && targetIp) {
      return "a_record"
    }

    return "cname"
  }

  private getDnsHost(domain: string, verificationType: CustomDomainVerificationType): string {
    if (verificationType === "a_record") {
      return "@"
    }

    return domain.split(".")[0] || domain
  }

  private buildInstructions(domain: string, expectedValue: string, verificationType: CustomDomainVerificationType): DnsInstructions {
    if (verificationType === "a_record") {
      return {
        type: "A",
        name: this.getDnsHost(domain, verificationType),
        value: expectedValue,
        note: "Point your root domain to your dedicated server ingress.",
        ttl: "Auto",
      }
    }

    return {
      type: "CNAME",
      name: this.getDnsHost(domain, verificationType),
      value: expectedValue,
      note: "Point your subdomain to your dedicated instance host.",
      ttl: "Auto",
    }
  }

  private withDnsDetails(domain: CustomDomainRecord): CustomDomainRecordWithDnsDetails {
    return {
      ...domain,
      dns_record_type: domain.verification_type,
      dns_host: this.getDnsHost(domain.domain, domain.verification_type),
      dns_value: domain.expected_value,
      target_ip: domain.verification_type === "a_record" ? domain.expected_value : null,
      target_host: domain.target_host,
    }
  }

  async createDomain(input: { domain: string }): Promise<{ domain: CustomDomainRecord; dns_instructions: DnsInstructions }> {
    const normalizedDomain = normalizeDomain(input.domain)
    const store = await this.getDefaultStore()
    const config = this.getConfig(store.metadata)
    const verificationType = this.resolveVerificationType(normalizedDomain, config.targetIp)
    const expectedValue = verificationType === "a_record" ? config.targetIp ?? "" : config.targetHost
    const existing = await this.moduleService.listCustomDomains({ domain: normalizedDomain })

    if (existing.length) {
      throw new Error("Domain already exists")
    }

    const created = await this.moduleService.createCustomDomains({
      store_id: store.id,
      domain: normalizedDomain,
      target_host: config.targetHost,
      expected_value: expectedValue,
      verification_type: verificationType,
      status: "pending_dns",
      failure_reason: null,
    })

    return {
      domain: created as CustomDomainRecord,
      dns_instructions: this.buildInstructions(normalizedDomain, created.expected_value, created.verification_type),
    }
  }

  async listDomains(): Promise<CustomDomainRecordWithDnsDetails[]> {
    const { id: storeId } = await this.getDefaultStore()
    const domains = (await this.moduleService.listCustomDomains(
      { store_id: storeId },
      { order: { created_at: "DESC" } }
    )) as CustomDomainRecord[]

    return domains.map((domain) => this.withDnsDetails(domain))
  }

  async markRemoved(id: string): Promise<CustomDomainRecord> {
    const { id: storeId } = await this.getDefaultStore()
    const domain = await this.requireDomain(id, storeId)

    return (await this.moduleService.updateCustomDomains({
      id: domain.id,
      status: "removed",
      failure_reason: null,
    })) as CustomDomainRecord
  }

  async verifyDomain(id: string): Promise<CustomDomainRecord> {
    const { id: storeId } = await this.getDefaultStore()
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
