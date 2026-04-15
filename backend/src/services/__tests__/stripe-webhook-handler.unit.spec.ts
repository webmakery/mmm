import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../modules/subscription-infrastructure"

const provisionRunMock = jest.fn()
const deleteRunMock = jest.fn()

jest.mock("../../workflows/provision-subscription-infrastructure", () => ({
  __esModule: true,
  default: jest.fn(() => ({ run: provisionRunMock })),
}))

jest.mock("../../workflows/delete-subscription-infrastructure", () => ({
  __esModule: true,
  default: jest.fn(() => ({ run: deleteRunMock })),
}))

const logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

class InMemoryInfraService {
  infrastructures: any[] = []

  events: any[] = []

  idCounter = 1

  listSubscriptionInfrastructures = jest.fn(async (filters: Record<string, unknown>) => {
    return this.infrastructures.filter((record) =>
      Object.entries(filters).every(([key, value]) => record[key] === value)
    )
  })

  createSubscriptionInfrastructures = jest.fn(async (data: Record<string, unknown>) => {
    const created = {
      id: `infra_${this.idCounter++}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    this.infrastructures.push(created)

    return created
  })

  updateSubscriptionInfrastructures = jest.fn(async (data: Record<string, unknown>) => {
    const record = this.infrastructures.find((item) => item.id === data.id)

    if (!record) {
      throw new Error(`Missing infrastructure ${String(data.id)}`)
    }

    Object.assign(record, data, { updated_at: new Date().toISOString() })

    return record
  })

  listStripeWebhookEvents = jest.fn(async (filters: Record<string, unknown>) => {
    return this.events.filter((event) =>
      Object.entries(filters).every(([key, value]) => event[key] === value)
    )
  })

  createStripeWebhookEvents = jest.fn(async (data: Record<string, unknown>) => {
    if (this.events.some((event) => event.event_id === data.event_id)) {
      throw new Error("duplicate")
    }

    const created = {
      id: `event_${this.events.length + 1}`,
      ...data,
    }

    this.events.push(created)

    return created
  })
}

describe("stripe webhook reprovisioning", () => {
  const infraService = new InMemoryInfraService()

  const container = {
    resolve: (key: string) => {
      if (key === SUBSCRIPTION_INFRASTRUCTURE_MODULE) {
        return infraService
      }

      if (key === "logger") {
        return logger
      }

      if (key === ContainerRegistrationKeys.QUERY) {
        return {
          graph: jest.fn(async () => ({ data: [] })),
        }
      }

      throw new Error(`Unexpected container resolve key: ${key}`)
    },
  }

  beforeEach(() => {
    infraService.infrastructures = []
    infraService.events = []
    infraService.idCounter = 1
    jest.clearAllMocks()
    process.env.HETZNER_PLAN_MAPPING = JSON.stringify({
      price_basic: {
        server_type: "cx23",
        image: "ubuntu-22.04",
        location: "nbg1",
      },
    })
  })

  it("provisions newly repurchased subscription even if old deleted infrastructure exists", async () => {
    jest.useFakeTimers().setSystemTime(new Date("2026-04-15T12:00:00.000Z"))

    const { processStripeWebhookEvent } = await import("../stripe-webhook-handler")

    await processStripeWebhookEvent({
      container: container as any,
      logger: logger as any,
      event: {
        id: "evt_old_checkout",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_old",
            customer: "cus_123",
            subscription: "sub_old",
            metadata: {
              customer_id: "cust_medusa",
              stripe_price_id: "price_basic",
            },
          },
        },
      } as any,
    })

    const oldInfrastructure = infraService.infrastructures.find(
      (record) => record.stripe_subscription_id === "sub_old"
    )

    await infraService.updateSubscriptionInfrastructures({
      id: oldInfrastructure.id,
      status: "deleted",
    })
    provisionRunMock.mockClear()

    jest.setSystemTime(new Date("2026-04-15T14:30:00.000Z"))

    await processStripeWebhookEvent({
      container: container as any,
      logger: logger as any,
      event: {
        id: "evt_invoice_without_subscription",
        type: "invoice.payment_succeeded",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "in_missing_subscription",
            customer: "cus_123",
            subscription: null,
          },
        },
      } as any,
    })

    await processStripeWebhookEvent({
      container: container as any,
      logger: logger as any,
      event: {
        id: "evt_new_checkout",
        type: "checkout.session.completed",
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: "cs_new",
            customer: "cus_123",
            subscription: "sub_new",
            metadata: {
              customer_id: "cust_medusa",
              stripe_price_id: "price_basic",
            },
          },
        },
      } as any,
    })

    const newInfrastructure = infraService.infrastructures.find(
      (record) => record.stripe_subscription_id === "sub_new"
    )

    expect(newInfrastructure).toBeDefined()
    expect(provisionRunMock).toHaveBeenCalledWith({
      input: {
        infrastructure_id: newInfrastructure.id,
      },
    })
    expect(provisionRunMock).not.toHaveBeenCalledWith({
      input: {
        infrastructure_id: oldInfrastructure.id,
      },
    })

    jest.useRealTimers()
  })

  it("ignores duplicate checkout webhook deliveries", async () => {
    const { processStripeWebhookEvent } = await import("../stripe-webhook-handler")

    const event = {
      id: "evt_checkout_duplicate",
      type: "checkout.session.completed",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: "cs_duplicate",
          customer: "cus_duplicate",
          subscription: "sub_duplicate",
          metadata: {
            customer_id: "cust_duplicate",
            stripe_price_id: "price_basic",
          },
        },
      },
    }

    const first = await processStripeWebhookEvent({
      container: container as any,
      logger: logger as any,
      event: event as any,
    })

    const second = await processStripeWebhookEvent({
      container: container as any,
      logger: logger as any,
      event: event as any,
    })

    expect(first).toEqual({ duplicate: false })
    expect(second).toEqual({ duplicate: true })
    expect(provisionRunMock).toHaveBeenCalledTimes(1)
    expect(infraService.infrastructures).toHaveLength(1)
  })
})
