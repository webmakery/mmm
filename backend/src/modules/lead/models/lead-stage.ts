import { model } from "@medusajs/framework/utils"
import Lead from "./lead"

const LeadStage = model.define("lead_stage", {
  id: model.id().primaryKey(),
  name: model.text(),
  slug: model.text().unique(),
  sort_order: model.number().default(0),
  color: model.text().nullable(),
  leads: model.hasMany(() => Lead, {
    mappedBy: "stage",
  }),
})

export default LeadStage
