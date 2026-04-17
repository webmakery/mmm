import dns from "node:dns/promises"
import type { CustomDomainVerificationType } from "../../modules/custom-domain/models/custom-domain"

const normalizeHost = (value: string): string => value.toLowerCase().replace(/\.$/, "")

export type DnsVerificationResult = {
  isValid: boolean
  reason: string | null
}

const resolveCnameChain = async (host: string, maxDepth = 8): Promise<string[]> => {
  const visited = new Set<string>()
  const chain: string[] = []

  let current = normalizeHost(host)

  for (let i = 0; i < maxDepth; i++) {
    if (visited.has(current)) {
      throw new Error("CNAME loop detected")
    }

    visited.add(current)
    chain.push(current)

    try {
      const records = await dns.resolveCname(current)
      if (!records.length) {
        break
      }

      current = normalizeHost(records[0])
    } catch (error: any) {
      if (error?.code === "ENODATA" || error?.code === "ENOTFOUND" || error?.code === "ENOTIMP") {
        break
      }

      throw error
    }
  }

  return chain
}

const verifyCnameTarget = async (domain: string, expectedHost: string): Promise<DnsVerificationResult> => {
  try {
    const chain = await resolveCnameChain(domain)
    const normalizedExpected = normalizeHost(expectedHost)

    if (chain.includes(normalizedExpected)) {
      return { isValid: true, reason: null }
    }

    return {
      isValid: false,
      reason: `Expected CNAME chain to include ${normalizedExpected}, got ${chain.join(" -> ")}`,
    }
  } catch (error: any) {
    return {
      isValid: false,
      reason: `DNS CNAME lookup failed: ${error?.message ?? "unknown error"}`,
    }
  }
}

const verifyAddressTarget = async (domain: string, expectedIp: string): Promise<DnsVerificationResult> => {
  try {
    const [aRecords, aaaaRecords] = await Promise.all([
      dns.resolve4(domain).catch((error: any) => {
        if (error?.code === "ENODATA" || error?.code === "ENOTFOUND") {
          return []
        }

        throw error
      }),
      dns.resolve6(domain).catch((error: any) => {
        if (error?.code === "ENODATA" || error?.code === "ENOTFOUND") {
          return []
        }

        throw error
      }),
    ])

    const addresses = [...aRecords, ...aaaaRecords].map(normalizeHost)
    const normalizedExpected = normalizeHost(expectedIp)

    if (addresses.includes(normalizedExpected)) {
      return { isValid: true, reason: null }
    }

    return {
      isValid: false,
      reason: `Expected ${normalizedExpected}, got ${addresses.join(", ") || "no A/AAAA records"}`,
    }
  } catch (error: any) {
    return {
      isValid: false,
      reason: `DNS address lookup failed: ${error?.message ?? "unknown error"}`,
    }
  }
}

export const verifyDomainDns = async ({
  domain,
  verificationType,
  expectedValue,
}: {
  domain: string
  verificationType: CustomDomainVerificationType
  expectedValue: string
}): Promise<DnsVerificationResult> => {
  if (verificationType === "cname") {
    return verifyCnameTarget(domain, expectedValue)
  }

  return verifyAddressTarget(domain, expectedValue)
}
