import net from "node:net"

const DOMAIN_REGEX = /^(?=.{1,253}$)(?:(?!-)[a-z0-9-]{1,63}(?<!-)\.)+(?:[a-z]{2,63})$/
const RESERVED_NAMES = new Set([
  "localhost",
  "local",
  "internal",
  "intranet",
  "home",
  "lan",
  "invalid",
  "example",
  "test",
])

export class DomainValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DomainValidationError"
  }
}

export const normalizeDomain = (input: string): string => {
  const trimmed = input.trim().toLowerCase()

  if (!trimmed) {
    throw new DomainValidationError("Domain is required")
  }

  if (trimmed.includes("://")) {
    throw new DomainValidationError("Do not include protocol prefixes")
  }

  if (/[/?#]/.test(trimmed)) {
    throw new DomainValidationError("Do not include paths or query strings")
  }

  if (trimmed.includes(":")) {
    throw new DomainValidationError("Do not include ports")
  }

  if (trimmed.includes("*")) {
    throw new DomainValidationError("Wildcard domains are not allowed")
  }

  const withoutDot = trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed

  if (!DOMAIN_REGEX.test(withoutDot)) {
    throw new DomainValidationError("Domain must be a valid FQDN")
  }

  if (net.isIP(withoutDot)) {
    throw new DomainValidationError("IP addresses are not allowed")
  }

  if (withoutDot.split(".").some((label) => RESERVED_NAMES.has(label))) {
    throw new DomainValidationError("Reserved or internal hostnames are not allowed")
  }

  return withoutDot
}
