import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { Logger } from "@medusajs/framework/types"
import SubscriptionInfrastructureModuleService from "../../../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../../../modules/subscription-infrastructure"
import HetznerCloudService from "../../../services/hetzner-cloud"

type DeleteStepInput = {
  infrastructure_id: string
}

const deleteHetznerServerStep = createStep(
  "delete-hetzner-server",
  async ({ infrastructure_id }: DeleteStepInput, { container }) => {
    const logger = container.resolve("logger") as Logger
    const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
      SUBSCRIPTION_INFRASTRUCTURE_MODULE
    )

    const infrastructure = await infraService.retrieveSubscriptionInfrastructure(infrastructure_id)

    if (infrastructure.status === "deleted") {
      logger.info(`[infra] Infrastructure ${infrastructure.id} already deleted`)
      return new StepResponse({ skipped: true })
    }

    await infraService.updateSubscriptionInfrastructures({
      id: infrastructure.id,
      status: "deleting",
      last_error: null,
    })

    if (!infrastructure.hetzner_server_id) {
      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        status: "deleted",
        last_error: null,
      })

      logger.info(
        `[infra] Marked infrastructure ${infrastructure.id} as deleted because server id is empty`
      )

      return new StepResponse({ skipped: false, infrastructure_id: infrastructure.id, already_deleted: true })
    }

    const hetzner = new HetznerCloudService()

    try {
      logger.info(
        `[infra] Hetzner deleteServer call infrastructure_id=${infrastructure.id} server_id=${infrastructure.hetzner_server_id}`
      )

      const result = await hetzner.deleteServer(infrastructure.hetzner_server_id)

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        status: "deleted",
        last_error: null,
      })

      logger.info(
        `[infra] Deleted Hetzner server ${infrastructure.hetzner_server_id} for infrastructure ${infrastructure.id}. alreadyDeleted=${result.alreadyDeleted}`
      )

      return new StepResponse({
        skipped: false,
        infrastructure_id: infrastructure.id,
        server_id: infrastructure.hetzner_server_id,
        already_deleted: result.alreadyDeleted,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown deletion error"

      await infraService.updateSubscriptionInfrastructures({
        id: infrastructure.id,
        status: "failed",
        last_error: message,
      })

      logger.error(`[infra] Deletion failed for infrastructure ${infrastructure.id}: ${message}`)

      throw e
    }
  }
)

export default deleteHetznerServerStep
