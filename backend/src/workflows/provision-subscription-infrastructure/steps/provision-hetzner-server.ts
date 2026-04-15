import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Logger } from "@medusajs/framework/types"
import SubscriptionInfrastructureModuleService from "../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../modules/subscription-infrastructure"
import HetznerCloudService from "../../../services/hetzner-cloud"

type ProvisionStepInput = {
  infrastructure_id: string
}

const provisionHetznerServerStep = createStep(
  "provision-hetzner-server",
  async ({ infrastructure_id }: ProvisionStepInput, { container }) => {
    const logger = container.resolve("logger") as Logger
    const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
      SUBSCRIPTION_INFRASTRUCTURE_MODULE
    )

    const infrastructure = await infraService.retrieveSubscriptionInfrastructure(infrastructure_id)

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
        `[infra] Hetzner createServer call infrastructure_id=${infrastructure.id} name=${infrastructure.hetzner_server_name}`
      )

      const result = await hetzner.createServer({
        name: infrastructure.hetzner_server_name,
        serverType: infrastructure.hetzner_server_type,
        image: infrastructure.hetzner_image,
        location: infrastructure.hetzner_region,
        labels: {
          managed_by: "medusa",
          order_id: infrastructure.order_id,
          subscription_id: infrastructure.stripe_subscription_id,
          customer_id: infrastructure.customer_id,
        },
        userData:
          process.env.HETZNER_SERVER_USER_DATA ||
          "#cloud-config\n# TODO: add bootstrap logic\n",
      })

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        hetzner_server_id: String(result.id),
        status: "active",
        last_error: null,
      })

      logger.info(
        `[infra] Provisioned Hetzner server ${result.id} for order ${infrastructure.order_id} and subscription ${infrastructure.stripe_subscription_id}`
      )

      return new StepResponse({ infrastructure_id: infrastructure.id, server_id: String(result.id) })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown provisioning error"

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        status: "failed",
        last_error: message,
      })

      logger.error(
        `[infra] Provisioning failed for infrastructure ${infrastructure.id}: ${message}`
      )

      throw e
    }
  }
)

export default provisionHetznerServerStep
