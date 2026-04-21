import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context, INotificationModuleService } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaError, MedusaService } from "@medusajs/framework/utils"
import crypto from "node:crypto"
import EmailCampaign from "./models/campaign"
import EmailCampaignLog from "./models/campaign-log"
import Subscriber, { SubscriberStatuses } from "./models/subscriber"
import EmailTemplate from "./models/template"

type SubscriberStatus = (typeof SubscriberStatuses)[number]
type CampaignAudienceFilter = {
  include_tags?: string[]
  exclude_tags?: string[]
  tag_match_mode?: "any" | "all"
}
type CampaignStatus = "draft" | "scheduled" | "automated" | "processing" | "sent" | "failed"

type ListConfig = { limit: number; offset: number }

class EmailMarketingModuleService extends MedusaService({
  Subscriber,
  EmailTemplate,
  EmailCampaign,
  EmailCampaignLog,
}) {
  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === "string") {
      return error
    }

    return "Unknown notification error"
  }

  private getSubscriberTagSet(tags: Record<string, unknown> | null | undefined) {
    if (!tags || typeof tags !== "object") {
      return new Set<string>()
    }

    const tagSet = new Set<string>()

    for (const [key, value] of Object.entries(tags)) {
      if (key.trim()) {
        tagSet.add(key.trim().toLowerCase())
      }

      if (typeof value === "string" && value.trim()) {
        tagSet.add(value.trim().toLowerCase())
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (typeof item === "string" && item.trim()) {
            tagSet.add(item.trim().toLowerCase())
          }
        })
      }
    }

    return tagSet
  }

  private filterSubscribersByAudience(
    subscribers: Subscriber[],
    audienceFilter: CampaignAudienceFilter | null | undefined
  ) {
    if (!audienceFilter) {
      return subscribers
    }

    const includeTags = (audienceFilter.include_tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const excludeTags = (audienceFilter.exclude_tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const tagMatchMode = audienceFilter.tag_match_mode === "all" ? "all" : "any"

    return subscribers.filter((subscriber) => {
      const subscriberTags = this.getSubscriberTagSet((subscriber.tags as Record<string, unknown>) || {})
      const includesMatch =
        includeTags.length === 0 ||
        (tagMatchMode === "all"
          ? includeTags.every((tag) => subscriberTags.has(tag))
          : includeTags.some((tag) => subscriberTags.has(tag)))

      if (!includesMatch) {
        return false
      }

      if (!excludeTags.length) {
        return true
      }

      return !excludeTags.some((tag) => subscriberTags.has(tag))
    })
  }

  private doesTagSetMatchAudience(tagSet: Set<string>, audienceFilter: CampaignAudienceFilter | null | undefined) {
    if (!audienceFilter) {
      return true
    }

    const includeTags = (audienceFilter.include_tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const excludeTags = (audienceFilter.exclude_tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)
    const tagMatchMode = audienceFilter.tag_match_mode === "all" ? "all" : "any"

    const includesMatch =
      includeTags.length === 0 ||
      (tagMatchMode === "all" ? includeTags.every((tag) => tagSet.has(tag)) : includeTags.some((tag) => tagSet.has(tag)))

    if (!includesMatch) {
      return false
    }

    if (!excludeTags.length) {
      return true
    }

    return !excludeTags.some((tag) => tagSet.has(tag))
  }

  @InjectManager()
  async triggerAutomatedCampaignsForSubscriber(
    input: {
      subscriber_id: string
      previous_tags?: Record<string, unknown> | null
      next_tags?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const previousTagSet = this.getSubscriberTagSet(input.previous_tags || {})
    const nextTagSet = this.getSubscriberTagSet(input.next_tags || {})
    const addedTags = Array.from(nextTagSet).filter((tag) => !previousTagSet.has(tag))

    if (!addedTags.length) {
      return
    }

    const campaigns = await this.listEmailCampaigns({ status: "automated" }, {}, sharedContext)

    for (const campaign of campaigns) {
      const audienceFilter = (campaign.audience_filter as CampaignAudienceFilter) || {}
      const includeTags = (audienceFilter.include_tags || []).map((tag) => tag.trim().toLowerCase()).filter(Boolean)

      if (includeTags.length && !addedTags.some((tag) => includeTags.includes(tag))) {
        continue
      }

      if (!this.doesTagSetMatchAudience(nextTagSet, audienceFilter)) {
        continue
      }

      const existingLogs = await this.listEmailCampaignLogs(
        {
          campaign_id: campaign.id,
          subscriber_id: input.subscriber_id,
        },
        {
          take: 1,
        },
        sharedContext
      )

      if (existingLogs.length) {
        continue
      }

      await this.createEmailCampaignLogs(
        {
          campaign_id: campaign.id,
          subscriber_id: input.subscriber_id,
          status: "queued",
        },
        sharedContext
      )
    }
  }

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
      const createdSubscriber = await this.createSubscribers(
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

      await this.triggerAutomatedCampaignsForSubscriber(
        {
          subscriber_id: createdSubscriber.id,
          previous_tags: {},
          next_tags: input.tags || {},
        },
        sharedContext
      )

      return createdSubscriber
    }

    const previousTags = (existing[0].tags as Record<string, unknown>) || {}
    const updatedSubscriber = await this.updateSubscribers(
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

    await this.triggerAutomatedCampaignsForSubscriber(
      {
        subscriber_id: existing[0].id,
        previous_tags: previousTags,
        next_tags: (updatedSubscriber.tags as Record<string, unknown>) || previousTags,
      },
      sharedContext
    )

    return updatedSubscriber
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
      status?: "draft" | "scheduled" | "automated"
      metadata?: Record<string, unknown>
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    return this.createEmailCampaigns(
      {
        ...input,
        template_id: input.template_id,
        status: (input.status as CampaignStatus | undefined) || (input.scheduled_at ? "scheduled" : "draft"),
        scheduled_at: input.scheduled_at ? new Date(input.scheduled_at) : null,
      },
      sharedContext
    )
  }

  @InjectManager()
  async queueCampaignSend(
    campaignId: string,
    notificationModuleService: INotificationModuleService,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)

    if (!campaign.template_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign template is required")
    }
    const template = await this.retrieveEmailTemplate(campaign.template_id, {}, sharedContext)

    const activeSubscribers = await this.listSubscribers({ status: "active" }, {}, sharedContext)
    const filteredSubscribers = this.filterSubscribersByAudience(
      activeSubscribers,
      (campaign.audience_filter as CampaignAudienceFilter) || {}
    )

    if (!filteredSubscribers.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No matching subscribers for this campaign audience")
    }

    await this.updateEmailCampaigns({ id: campaign.id, status: "processing" }, sharedContext)

    const createdLogs = await this.createEmailCampaignLogs(
      filteredSubscribers.map((subscriber) => ({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        status: "queued",
      })),
      sharedContext
    )

    const logs = Array.isArray(createdLogs) ? createdLogs : [createdLogs]
    const logBySubscriberId = new Map(logs.map((log) => [log.subscriber_id, log]))
    let sentCount = 0

    for (const subscriber of filteredSubscribers) {
      const log = logBySubscriberId.get(subscriber.id)

      if (!log) {
        continue
      }

      try {
        await notificationModuleService.createNotifications({
          to: subscriber.email,
          channel: "email",
          template: "email-marketing-campaign",
          data: {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            subscriber_id: subscriber.id,
            subscriber_email: subscriber.email,
          },
          content: {
            subject: campaign.subject || template.subject,
            html: template.html_content,
            text: template.text_content || undefined,
          },
        })

        await this.updateEmailCampaignLogs(
          {
            id: log.id,
            status: "sent",
            error_message: null,
          },
          sharedContext
        )
        sentCount += 1
      } catch (error) {
        const errorMessage = this.getErrorMessage(error)

        console.error(`[email-marketing] Failed to send campaign ${campaign.id} to subscriber ${subscriber.id}: ${errorMessage}`)

        await this.updateEmailCampaignLogs(
          {
            id: log.id,
            status: "failed",
            error_message: errorMessage,
          },
          sharedContext
        )
      }
    }

    return this.updateEmailCampaigns(
      {
        id: campaign.id,
        status: sentCount > 0 ? "sent" : "failed",
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
