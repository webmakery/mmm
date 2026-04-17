import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import CustomDomainService from "../custom-domain-service"

describe("CustomDomainService.createDomain", () => {
  const originalEnv = process.env

  afterEach(() => {
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  const buildService = () => {
    const graph = jest.fn().mockResolvedValue({ data: [{ id: "store_123" }] })
    const query = { graph }
    const listCustomDomains = jest.fn().mockResolvedValue([])
    const createCustomDomains = jest.fn().mockImplementation(async (input) => ({
      id: "cd_123",
      ...input,
      last_checked_at: null,
      activated_at: null,
      created_at: new Date("2026-04-17T00:00:00Z"),
      updated_at: new Date("2026-04-17T00:00:00Z"),
    }))
    const moduleService = { listCustomDomains, createCustomDomains }
    const container = {
      resolve: jest.fn((key) => {
        if (key === ContainerRegistrationKeys.QUERY) {
          return query
        }
        return moduleService
      }),
    }

    return {
      service: new CustomDomainService(container),
      createCustomDomains,
    }
  }

  it("uses CNAME verification by default", async () => {
    process.env = {
      ...originalEnv,
      PLATFORM_DOMAIN_TARGET_HOST: "Target.Example.com",
    }

    const { service, createCustomDomains } = buildService()

    const result = await service.createDomain({ domain: "Shop.Brand.com" })

    expect(createCustomDomains).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_value: "target.example.com",
        verification_type: "cname",
      })
    )
    expect(result.dns_instructions).toEqual({
      type: "CNAME",
      name: "shop.brand.com",
      value: "target.example.com",
      note: "Create a CNAME record pointing your custom domain to your assigned platform hostname.",
    })
  })

  it("uses A-record verification when VPS_PUBLIC_IP is configured", async () => {
    process.env = {
      ...originalEnv,
      PLATFORM_DOMAIN_TARGET_HOST: "target.example.com",
      VPS_PUBLIC_IP: "203.0.113.10",
    }

    const { service, createCustomDomains } = buildService()

    const result = await service.createDomain({ domain: "shop.brand.com" })

    expect(createCustomDomains).toHaveBeenCalledWith(
      expect.objectContaining({
        expected_value: "203.0.113.10",
        verification_type: "a_record",
      })
    )
    expect(result.dns_instructions).toEqual({
      type: "A",
      name: "shop.brand.com",
      value: "203.0.113.10",
      note: "Create an A record pointing to your VPS public IP.",
    })
  })
})
