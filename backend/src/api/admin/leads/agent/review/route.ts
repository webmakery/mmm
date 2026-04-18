import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query")

  const { data: leads } = await query.graph({
    entity: "lead",
    fields: [
      "id",
      "first_name",
      "company",
      "source",
      "source_detail",
      "category",
      "lead_score",
      "lead_score_notes",
      "follow_up_status",
      "next_follow_up_at",
      "owner_user_id",
      "outreach_message_draft",
      "created_at",
    ],
    filters: {
      follow_up_status: ["pending_approval", "approved", "failed"],
    },
    pagination: {
      take: 100,
      skip: 0,
      order: {
        created_at: "DESC",
      },
    },
  })

  res.json({
    leads,
    count: leads.length,
  })
}
