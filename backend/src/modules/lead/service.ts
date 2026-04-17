import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import Lead from "./models/lead"
import LeadActivity from "./models/lead-activity"
import LeadStage from "./models/lead-stage"

export type LeadListFilters = {
  q?: string
  status?: string
  stage_id?: string
  owner_user_id?: string
  source?: string
  follow_up?: "overdue" | "today"
}

class LeadModuleService extends MedusaService({
  Lead,
  LeadStage,
  LeadActivity,
}) {
  @InjectManager()
  async listLeadsWithFilters(
    filters: LeadListFilters,
    pagination: { limit: number; offset: number },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const values: unknown[] = []

    const whereClauses = ["l.deleted_at is null"]

    if (filters.status) {
      values.push(filters.status)
      whereClauses.push(`l.status = ?`)
    }

    if (filters.stage_id) {
      values.push(filters.stage_id)
      whereClauses.push(`l.stage_id = ?`)
    }

    if (filters.owner_user_id) {
      values.push(filters.owner_user_id)
      whereClauses.push(`l.owner_user_id = ?`)
    }

    if (filters.source) {
      values.push(filters.source)
      whereClauses.push(`l.source = ?`)
    }

    if (filters.follow_up === "overdue") {
      whereClauses.push(`l.next_follow_up_at is not null and l.next_follow_up_at < now()`)
    }

    if (filters.follow_up === "today") {
      whereClauses.push(`l.next_follow_up_at is not null and date(l.next_follow_up_at) = current_date`)
    }

    if (filters.q) {
      values.push(`%${filters.q}%`)
      whereClauses.push(`(concat_ws(' ', l.first_name, l.last_name) ilike ? or l.email ilike ? or l.company ilike ?)`)
      values.push(`%${filters.q}%`, `%${filters.q}%`)
    }

    const whereSql = whereClauses.join(" and ")

    const rows = await manager?.execute(
      `
      select
        l.*,
        s.name as stage_name,
        s.slug as stage_slug,
        s.sort_order as stage_sort_order,
        s.color as stage_color
      from lead l
      left join lead_stage s on s.id = l.stage_id
      where ${whereSql}
      order by l.created_at desc
      limit ? offset ?
      `,
      [...values, pagination.limit, pagination.offset]
    )

    const countResult = await manager?.execute(
      `select count(*)::int as count from lead l where ${whereSql}`,
      values
    )

    return {
      leads: rows ?? [],
      count: countResult?.[0]?.count ?? 0,
    }
  }
}

export default LeadModuleService
