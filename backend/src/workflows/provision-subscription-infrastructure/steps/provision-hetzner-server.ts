import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Logger } from "@medusajs/framework/types"
import SubscriptionInfrastructureModuleService from "../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../modules/subscription-infrastructure"
import HetznerCloudService from "../../../services/hetzner-cloud"

type ProvisionStepInput = {
  infrastructure_id: string
}

export const sanitizeHetznerLabelSegment = (value: string, fallback: string) => {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[^a-z0-9]+$/, "")
    .slice(0, 63)

  return normalized || fallback
}

export const buildHetznerLabels = (infrastructure: {
  order_id?: string | null
  stripe_subscription_id?: string | null
  customer_id?: string | null
}) => ({
  managed_by: "medusa",
  order_id: sanitizeHetznerLabelSegment(infrastructure.order_id || "na", "na"),
  subscription_id: sanitizeHetznerLabelSegment(
    infrastructure.stripe_subscription_id || "na",
    "na"
  ),
  customer_id: sanitizeHetznerLabelSegment(infrastructure.customer_id || "na", "na"),
})

const provisionHetznerServerStep = createStep(
  "provision-hetzner-server",
  async ({ infrastructure_id }: ProvisionStepInput, { container }) => {
    const logger = container.resolve("logger") as Logger
    const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
      SUBSCRIPTION_INFRASTRUCTURE_MODULE
    )

    const infrastructure = await infraService.retrieveSubscriptionInfrastructure(infrastructure_id)

    if (infrastructure.status === "provisioning") {
      logger.info(
        `[infra] Skipping provisioning. Infrastructure ${infrastructure.id} is already provisioning`
      )
      return new StepResponse({ skipped: true })
    }

    if (infrastructure.hetzner_server_id && infrastructure.status === "active") {
      logger.info(
        `[infra] Skipping provisioning. Infrastructure ${infrastructure.id} already active on server ${infrastructure.hetzner_server_id}`
      )
      return new StepResponse({ skipped: true })
    }

    await infraService.updateSubscriptionInfrastructures({
      id: infrastructure.id,
      status: "provisioning",
      last_error: null,
    })

    const hetzner = new HetznerCloudService()

    try {
      logger.info(
        `[infra] plan mapping availability infrastructure_id=${infrastructure.id} server_type_set=${!!infrastructure.hetzner_server_type} image_set=${!!infrastructure.hetzner_image} location_set=${!!infrastructure.hetzner_region}`
      )

      logger.info(
        `[infra] Hetzner createServer request infrastructure_id=${infrastructure.id} name=${infrastructure.hetzner_server_name} server_type=${infrastructure.hetzner_server_type} image=${infrastructure.hetzner_image} location=${infrastructure.hetzner_region}`
      )

      const result = await hetzner.createServer({
        name: infrastructure.hetzner_server_name,
        serverType: infrastructure.hetzner_server_type,
        image: infrastructure.hetzner_image,
        location: infrastructure.hetzner_region,
        labels: buildHetznerLabels(infrastructure),
        userData:
          process.env.HETZNER_SERVER_USER_DATA ||
          "#cloud-config\n# TODO: add bootstrap logic\n",
      })

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        hetzner_server_id: String(result.id),
        server_ip: result.publicIpV4,
        server_cpu: result.cpuCores,
        server_ram_gb: result.ramGb,
        status: "active",
        last_error: null,
        failure_diagnostics: null,
        last_provisioning_finished_at: new Date(),
      })

      logger.info(
        `[infra] created Hetzner server ID server_id=${result.id} infrastructure_id=${infrastructure.id}`
      )

      logger.info(
        `[infra] Provisioned Hetzner server ${result.id} for order ${infrastructure.order_id} and subscription ${infrastructure.stripe_subscription_id}`
      )

      return new StepResponse({ skipped: false, infrastructure_id: infrastructure.id, server_id: String(result.id) })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown provisioning error"

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        status: "failed",
        last_error: message,
        failure_diagnostics: {
          message,
          name: e instanceof Error ? e.name : "Error",
          stack: e instanceof Error ? e.stack : undefined,
        },
        last_provisioning_finished_at: new Date(),
      })

      logger.error(
        `[infra] Provisioning failed for infrastructure ${infrastructure.id}: ${message}`
      )

      throw e
    }
  }
)

export default provisionHetznerServerStep
