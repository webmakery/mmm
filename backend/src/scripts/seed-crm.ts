import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { LEAD_MODULE } from "../modules/lead"
import LeadModuleService from "../modules/lead/service"

const defaultStages = [
  { name: "New", slug: "new", sort_order: 0 },
  { name: "Contacted", slug: "contacted", sort_order: 1 },
  { name: "Qualified", slug: "qualified", sort_order: 2 },
  { name: "Proposal", slug: "proposal", sort_order: 3 },
  { name: "Won", slug: "won", sort_order: 4 },
  { name: "Lost", slug: "lost", sort_order: 5 },
]

export default async function seedCrmData({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const leadService: LeadModuleService = container.resolve(LEAD_MODULE)

  logger.info("Seeding CRM stages...")
  const existingStages = await leadService.listLeadStages()

  const stagesBySlug = new Map(existingStages.map((stage) => [stage.slug, stage]))

  for (const stage of defaultStages) {
    if (stagesBySlug.has(stage.slug)) {
      continue
    }

    const created = await leadService.createLeadStages(stage)
    stagesBySlug.set(created.slug, created)
  }

  logger.info("Seeding CRM sample leads...")

  const samples = [
    {
      first_name: "Avery",
      last_name: "Miller",
      email: "avery.miller@example.com",
      company: "Northwind Labs",
      source: "manual",
      status: "new" as const,
      stage_slug: "new",
    },
    {
      first_name: "Jordan",
      last_name: "Lee",
      email: "jordan.lee@example.com",
      company: "Pioneer Systems",
      source: "manual",
      status: "contacted" as const,
      stage_slug: "contacted",
    },
    {
      first_name: "Riley",
      last_name: "Patel",
      email: "riley.patel@example.com",
      company: "Summit Dynamics",
      source: "manual",
      status: "qualified" as const,
      stage_slug: "qualified",
    },
  ]

  for (const sample of samples) {
    const existing = await leadService.listLeads({ email: sample.email }, { take: 1 })

    if (existing.length > 0) {
      continue
    }

    await leadService.createLeads({
      first_name: sample.first_name,
      last_name: sample.last_name,
      email: sample.email,
      company: sample.company,
      source: sample.source,
      status: sample.status,
      stage_id: stagesBySlug.get(sample.stage_slug)?.id,
    })
  }

  logger.info("CRM seed complete")
}
