import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils"
import crypto from "node:crypto"
import EmailCampaign from "./models/campaign"
import EmailCampaignLog from "./models/campaign-log"
import Subscriber, { SubscriberStatuses } from "./models/subscriber"
import EmailTemplate from "./models/template"

type SubscriberStatus = (typeof SubscriberStatuses)[number]

type ListConfig = { limit: number; offset: number }
type AudienceFilter = Record<string, unknown>

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value)

const matchesAudienceValue = (subscriberValue: unknown, filterValue: unknown): boolean => {
  if (Array.isArray(filterValue)) {
    if (!Array.isArray(subscriberValue)) {
      return false
    }

    return filterValue.every((value) => subscriberValue.includes(value))
  }

  if (isRecord(filterValue)) {
    if (!isRecord(subscriberValue)) {
      return false
    }

    return Object.entries(filterValue).every(([key, value]) =>
      matchesAudienceValue(subscriberValue[key], value)
    )
  }

  return subscriberValue === filterValue
}

const matchesAudienceFilter = (subscriber: Record<string, unknown>, filter?: AudienceFilter | null): boolean => {
  if (!filter || Object.keys(filter).length === 0) {
    return true
  }

  return Object.entries(filter).every(([key, value]) =>
    matchesAudienceValue(subscriber[key], value)
  )
}

class EmailMarketingModuleService extends MedusaService({
  Subscriber,
  EmailTemplate,
  EmailCampaign,
  EmailCampaignLog,
}) {
  @InjectManager()
  async createOrUpdateSubscriber(
    input: {
      email: string
      first_name?: string | null
      last_name?: string | null
      status?: SubscriberStatus
      tags?: Record<string, unknown>
      source?: string | null
      metadata?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const email = input.email.trim().toLowerCase()
    const existing = await this.listSubscribers({ email }, {}, sharedContext)

    if (!existing.length) {
      return this.createSubscribers(
        {
          email,
          first_name: input.first_name ?? null,
          last_name: input.last_name ?? null,
          status: input.status || "active",
          tags: input.tags || {},
          source: input.source ?? "admin",
          unsubscribe_token: crypto.randomBytes(24).toString("hex"),
          metadata: input.metadata ?? null,
        },
        sharedContext
      )
    }

    return this.updateSubscribers(
      {
        id: existing[0].id,
        first_name: input.first_name ?? existing[0].first_name,
        last_name: input.last_name ?? existing[0].last_name,
        status: input.status ?? existing[0].status,
        tags: input.tags ?? (existing[0].tags as Record<string, unknown>),
        source: input.source ?? existing[0].source,
        metadata: input.metadata ?? (existing[0].metadata as Record<string, unknown>),
      },
      sharedContext
    )
  }

  @InjectManager()
  async listSubscribersPaginated(filters: { q?: string; status?: SubscriberStatus }, config: ListConfig, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager
    const values: unknown[] = []
    const where = ["deleted_at is null"]

    if (filters.status) {
      values.push(filters.status)
      where.push("status = ?")
    }

    if (filters.q) {
      values.push(`%${filters.q}%`)
      where.push("(email ilike ? or coalesce(first_name, '') ilike ? or coalesce(last_name, '') ilike ?)")
      values.push(`%${filters.q}%`, `%${filters.q}%`)
    }

    const whereSql = where.join(" and ")
    const rows = await manager?.execute(
      `select * from email_subscriber where ${whereSql} order by created_at desc limit ? offset ?`,
      [...values, config.limit, config.offset]
    )
    const countRows = await manager?.execute(`select count(*)::int as count from email_subscriber where ${whereSql}`, values)

    return {
      subscribers: rows || [],
      count: Number((countRows?.[0] as { count?: number })?.count || 0),
    }
  }

  @InjectManager()
  async unsubscribeByToken(token: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const subscribers = await this.listSubscribers({ unsubscribe_token: token }, {}, sharedContext)

    if (!subscribers.length) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, "Subscriber not found")
    }

    return this.updateSubscribers(
      {
        id: subscribers[0].id,
        status: "unsubscribed",
        unsubscribed_at: new Date(),
      },
      sharedContext
    )
  }

  @InjectManager()
  async renderTemplatePreview(
    templateId: string,
    variables: Record<string, string>,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const template = await this.retrieveEmailTemplate(templateId, {}, sharedContext)

    const render = (value: string) =>
      value.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => variables[key] || `{{${key}}}`)

    return {
      subject: render(template.subject),
      html_content: render(template.html_content),
      text_content: template.text_content ? render(template.text_content) : null,
    }
  }

  @InjectManager()
  async createCampaignDraft(
    input: {
      name: string
      subject: string
      sender_name: string
      sender_email: string
      template_id: string
      scheduled_at?: string | null
      audience_filter?: Record<string, unknown>
      status?: "draft" | "scheduled"
      metadata?: Record<string, unknown>
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return this.createEmailCampaigns(
      {
        ...input,
        template_id: input.template_id,
        status: input.status || (input.scheduled_at ? "scheduled" : "draft"),
        scheduled_at: input.scheduled_at ? new Date(input.scheduled_at) : null,
      },
      sharedContext
    )
  }

  @InjectManager()
  async queueCampaignSend(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)

    if (!campaign.template_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign template is required")
    }

    const activeSubscribers = await this.listSubscribers({ status: "active" }, {}, sharedContext)
    const audienceFilter = campaign.audience_filter as AudienceFilter | null | undefined
    const recipients = activeSubscribers.filter((subscriber) =>
      matchesAudienceFilter(subscriber as unknown as Record<string, unknown>, audienceFilter)
    )

    if (!recipients.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No subscribers match the campaign audience")
    }

    await this.updateEmailCampaigns({ id: campaign.id, status: "processing" }, sharedContext)

    await this.createEmailCampaignLogs(
      recipients.map((subscriber) => ({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        status: "queued",
      })),
      sharedContext
    )

    return this.updateEmailCampaigns(
      {
        id: campaign.id,
        status: "sent",
        sent_at: new Date(),
      },
      sharedContext
    )
  }

  @InjectManager()
  async getCampaignAnalytics(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager
    const result = await manager?.execute(
      `
      select
        count(*)::int as total_recipients,
        count(*) filter (where status in ('sent', 'delivered', 'opened', 'clicked'))::int as sent_count,
        count(*) filter (where status in ('delivered', 'opened', 'clicked'))::int as delivered_count,
        count(*) filter (where status = 'failed')::int as failed_count,
        count(*) filter (where status in ('opened', 'clicked'))::int as opened_count,
        count(*) filter (where status = 'clicked')::int as clicked_count
      from email_campaign_log
      where campaign_id = ? and deleted_at is null
      `,
      [campaignId]
    )

    const row = (result?.[0] || {}) as Record<string, number>
    const total = Number(row.total_recipients || 0)
    const opened = Number(row.opened_count || 0)
    const clicked = Number(row.clicked_count || 0)

    return {
      total_recipients: total,
      sent_count: Number(row.sent_count || 0),
      delivered_count: Number(row.delivered_count || 0),
      failed_count: Number(row.failed_count || 0),
      open_rate: total > 0 ? opened / total : 0,
      click_rate: total > 0 ? clicked / total : 0,
    }
  }

  @InjectManager()
  async countTemplates(@MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager
    const result = await manager?.execute(
      `select count(*)::int as count from email_template where deleted_at is null`
    )
    return Number((result?.[0] as { count?: number })?.count || 0)
  }

  @InjectManager()
  async countCampaigns(status?: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager
    const result = await manager?.execute(
      `select count(*)::int as count from email_campaign where deleted_at is null and (?::text is null or status = ?)`,
      [status || null, status || null]
    )
    return Number((result?.[0] as { count?: number })?.count || 0)
  }
}

export default EmailMarketingModuleService
