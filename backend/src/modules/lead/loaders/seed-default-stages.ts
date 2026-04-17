import { IMedusaInternalService, LoaderOptions } from "@medusajs/framework/types"
import LeadStage from "../models/lead-stage"

const defaultStages = [
  { name: "New", slug: "new", sort_order: 0 },
  { name: "Contacted", slug: "contacted", sort_order: 1 },
  { name: "Qualified", slug: "qualified", sort_order: 2 },
  { name: "Proposal", slug: "proposal", sort_order: 3 },
  { name: "Won", slug: "won", sort_order: 4 },
  { name: "Lost", slug: "lost", sort_order: 5 },
]

export default async function seedDefaultLeadStages({ container }: LoaderOptions) {
  const service: IMedusaInternalService<typeof LeadStage> = container.resolve("leadStageService")

  const [, count] = await service.listAndCount()

  if (count > 0) {
    return
  }

  await service.create(defaultStages)
}
