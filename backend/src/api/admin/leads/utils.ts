import { MedusaError } from "@medusajs/framework/utils"
import LeadModuleService from "../../../modules/lead/service"

type LeadStage = {
  id: string
  slug?: string | null
  sort_order?: number | null
}

type ResolveLeadStageIdInput = {
  leadService: LeadModuleService
  stageId?: string
}

export const resolveLeadStageId = async ({ leadService, stageId }: ResolveLeadStageIdInput) => {
  const normalizedStageId = stageId?.trim()

  if (normalizedStageId) {
    const stages = await leadService.listLeadStages({ id: [normalizedStageId] })

    if (!stages.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The selected lead stage is invalid.")
    }

    return stages[0].id
  }

  const stages = await leadService.listLeadStages({}, { order: { sort_order: "ASC" } })

  if (!stages.length) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Could not create lead because no default pipeline stage is configured."
    )
  }

  const preferredStage = pickDefaultStage(stages)

  if (!preferredStage?.id) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Could not create lead because no default pipeline stage is configured."
    )
  }

  return preferredStage.id
}

const pickDefaultStage = (stages: LeadStage[]) => {
  const newStage = stages.find((stage) => stage.slug?.toLowerCase() === "new")

  if (newStage) {
    return newStage
  }

  return [...stages].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0]
}
