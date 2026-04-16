import { Logger } from "@medusajs/framework/types"
import SubscriptionInfrastructureModuleService from "../modules/subscription-infrastructure/service"
import { SUBSCRIPTION_INFRASTRUCTURE_MODULE } from "../modules/subscription-infrastructure"
import provisionSubscriptionInfrastructureWorkflow from "../workflows/provision-subscription-infrastructure"

type ResolveContainer = {
  resolve: <T = unknown>(key: string) => T
}

type RetryInput = {
  container: ResolveContainer
  infrastructureId: string
  triggeredBy: "webhook" | "admin"
  actorId?: string
  override?: {
    server_type?: string
    location?: string
    image?: string
  }
  logger: Logger
}

const buildErrorDiagnostics = (error: unknown) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: "Unknown provisioning error",
    raw: JSON.stringify(error),
  }
}

export const retryInfrastructureProvisioning = async ({
  container,
  infrastructureId,
  override,
  triggeredBy,
  actorId,
  logger,
}: RetryInput) => {
  const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  const infrastructure = await infraService.retrieveSubscriptionInfrastructure(infrastructureId)

  if (infrastructure.status === "provisioning") {
    logger.info(
      `[infra-retry] skip already provisioning infrastructure_id=${infrastructure.id} triggered_by=${triggeredBy}`
    )

    return { skipped: true, reason: "already_provisioning" }
  }

  if (infrastructure.status === "cancelled" || infrastructure.status === "deleted") {
    logger.info(
      `[infra-retry] skip cancelled/deleted infrastructure_id=${infrastructure.id} status=${infrastructure.status}`
    )

    return { skipped: true, reason: "cancelled_or_deleted" }
  }

  if (infrastructure.status === "active" && infrastructure.hetzner_server_id) {
    logger.info(
      `[infra-retry] skip already active infrastructure_id=${infrastructure.id} server_id=${infrastructure.hetzner_server_id}`
    )

    return { skipped: true, reason: "already_active" }
  }

  const attemptNumber = Number(infrastructure.provisioning_retry_count || 0) + 1
  const startedAt = new Date()

  await infraService.updateSubscriptionInfrastructures({
    id: infrastructure.id,
    hetzner_server_type: override?.server_type || infrastructure.hetzner_server_type,
    hetzner_region: override?.location || infrastructure.hetzner_region,
    hetzner_image: override?.image || infrastructure.hetzner_image,
    status: "pending",
    last_error: null,
    failure_diagnostics: null,
    last_provisioning_started_at: startedAt,
    last_provisioning_finished_at: null,
    provisioning_retry_count: attemptNumber,
    cancelled_at: null,
    cancelled_by: null,
  })

  const attempt = await infraService.createSubscriptionInfrastructureProvisionAttempts({
    infrastructure_id: infrastructure.id,
    attempt_number: attemptNumber,
    triggered_by: triggeredBy,
    trigger_actor_id: actorId || null,
    requested_server_type: override?.server_type || null,
    requested_location: override?.location || null,
    requested_image: override?.image || null,
    provider_server_id: null,
    status: "started",
    error_message: null,
    diagnostics: null,
    started_at: startedAt,
    finished_at: null,
  })

  logger.info(
    `[infra-retry] start infrastructure_id=${infrastructure.id} attempt=${attemptNumber} triggered_by=${triggeredBy}`
  )

  try {
    await provisionSubscriptionInfrastructureWorkflow(container as any).run({
      input: {
        infrastructure_id: infrastructure.id,
      },
    })

    const refreshed = await infraService.retrieveSubscriptionInfrastructure(infrastructure.id)

    await infraService.updateSubscriptionInfrastructureProvisionAttempts({
      id: attempt.id,
      status: "succeeded",
      provider_server_id: refreshed.hetzner_server_id || null,
      finished_at: new Date(),
    })

    if (triggeredBy === "admin") {
      await infraService.createSubscriptionInfrastructureAdminAuditLogs({
        infrastructure_id: infrastructure.id,
        action: "provision_retry_succeeded",
        actor_id: actorId || null,
        details: {
          attempt_number: attemptNumber,
          override: override || null,
        },
      })
    }

    return { skipped: false, attempt_number: attemptNumber }
  } catch (error) {
    const diagnostics = buildErrorDiagnostics(error)
    const finishedAt = new Date()

    await infraService.updateSubscriptionInfrastructureProvisionAttempts({
      id: attempt.id,
      status: "failed",
      error_message: diagnostics.message,
      diagnostics,
      finished_at: finishedAt,
    })

    await infraService.updateSubscriptionInfrastructures({
      id: infrastructure.id,
      status: "failed",
      last_error: diagnostics.message,
      failure_diagnostics: diagnostics,
      last_provisioning_finished_at: finishedAt,
    })

    if (triggeredBy === "admin") {
      await infraService.createSubscriptionInfrastructureAdminAuditLogs({
        infrastructure_id: infrastructure.id,
        action: "provision_retry_failed",
        actor_id: actorId || null,
        details: {
          attempt_number: attemptNumber,
          override: override || null,
          diagnostics,
        },
      })
    }

    logger.error(
      `[infra-retry] failed infrastructure_id=${infrastructure.id} attempt=${attemptNumber} message=${diagnostics.message}`
    )

    throw error
  }
}

export const markInfrastructureCancelled = async ({
  container,
  infrastructureId,
  actorId,
  logger,
}: {
  container: ResolveContainer
  infrastructureId: string
  actorId?: string
  logger: Logger
}) => {
  const infraService = container.resolve<SubscriptionInfrastructureModuleService>(
    SUBSCRIPTION_INFRASTRUCTURE_MODULE
  )

  await infraService.updateSubscriptionInfrastructures({
    id: infrastructureId,
    status: "cancelled",
    cancelled_at: new Date(),
    cancelled_by: actorId || null,
    last_provisioning_finished_at: new Date(),
  })

  await infraService.createSubscriptionInfrastructureAdminAuditLogs({
    infrastructure_id: infrastructureId,
    action: "marked_cancelled",
    actor_id: actorId || null,
    details: null,
  })

  logger.info(
    `[infra-admin] marked cancelled infrastructure_id=${infrastructureId} actor_id=${actorId || "n/a"}`
  )
}
