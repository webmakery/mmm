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
type QueueCampaignSendOptions = {
  subscriber_ids?: string[]
  allow_already_sent?: boolean
  skip_processing_status_update?: boolean
}
type CampaignDeliveryStatus = "queued" | "sent" | "delivered" | "opened" | "clicked" | "failed"
type CampaignLiveAggregate = {
  total_recipients: number
  sent_count: number
  delivered_count: number
  failed_count: number
  opened_count: number
  clicked_count: number
}

type ListConfig = { limit: number; offset: number }

class EmailMarketingModuleService extends MedusaService({
  Subscriber,
  EmailTemplate,
  EmailCampaign,
  EmailCampaignLog,
}) {
  private static readonly trackingPixelTransparentGifBase64 =
    "R0lGODlhAQABAIAAAP///////yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"

  private readonly statusPriority: Record<CampaignDeliveryStatus, number> = {
    queued: 0,
    failed: 1,
    sent: 2,
    delivered: 3,
    opened: 4,
    clicked: 5,
  }

  private normalizeAudienceFilter(audienceFilter: CampaignAudienceFilter | null | undefined): CampaignAudienceFilter {
    const normalizeTags = (tags: string[] | undefined) =>
      Array.from(
        new Set(
          (tags || [])
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)
        )
      )

    return {
      include_tags: normalizeTags(audienceFilter?.include_tags),
      exclude_tags: normalizeTags(audienceFilter?.exclude_tags),
      tag_match_mode: audienceFilter?.tag_match_mode === "all" ? "all" : "any",
    }
  }

  private assertCampaignConfig(params: {
    status: "draft" | "scheduled" | "automated"
    scheduled_at: Date | null
    audience_filter: CampaignAudienceFilter
  }) {
    if (params.status === "scheduled" && !params.scheduled_at) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Scheduled campaigns require scheduled_at")
    }

    if (params.status !== "scheduled" && params.scheduled_at) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Only campaigns with status 'scheduled' can define scheduled_at"
      )
    }

    if (params.status === "automated" && !params.audience_filter.include_tags?.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Automated campaigns require at least one include tag in audience_filter.include_tags"
      )
    }
  }

  private getErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message
    }

    if (typeof error === "string") {
      return error
    }

    return "Unknown notification error"
  }

  private sanitizeOrigin(url: string) {
    try {
      return new URL(url).origin
    } catch {
      return ""
    }
  }

  private getTrackingBaseUrl() {
    const directUrl =
      process.env.EMAIL_MARKETING_TRACKING_BASE_URL ||
      process.env.MEDUSA_BACKEND_URL ||
      process.env.BACKEND_URL

    if (directUrl) {
      const origin = this.sanitizeOrigin(directUrl)

      if (origin) {
        return origin
      }
    }

    const corsOrigin = (process.env.STORE_CORS || process.env.ADMIN_CORS || "")
      .split(",")
      .map((value) => value.trim())
      .find(Boolean)

    if (corsOrigin) {
      const origin = this.sanitizeOrigin(corsOrigin)

      if (origin) {
        return origin
      }
    }

    return "http://localhost:9000"
  }

  private buildOpenTrackingToken(campaignId: string, subscriberId: string) {
    const payload = JSON.stringify({
      campaign_id: campaignId,
      subscriber_id: subscriberId,
    })
    const payloadBase64 = Buffer.from(payload, "utf8").toString("base64url")
    const signature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "supersecret")
      .update(payloadBase64)
      .digest("base64url")

    return `${payloadBase64}.${signature}`
  }

  private decodeOpenTrackingToken(token: string) {
    const [payloadBase64, signature] = token.split(".")

    if (!payloadBase64 || !signature) {
      return null
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.JWT_SECRET || "supersecret")
      .update(payloadBase64)
      .digest("base64url")

    if (expectedSignature !== signature) {
      return null
    }

    try {
      const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString("utf8")) as {
        campaign_id?: string
        subscriber_id?: string
      }

      if (!payload.campaign_id || !payload.subscriber_id) {
        return null
      }

      return payload
    } catch {
      return null
    }
  }

  private appendTrackingPixel(html: string, trackingUrl: string) {
    const pixelTag = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:block;opacity:0;max-height:1px;max-width:1px;" />`

    if (/<\/body>/i.test(html)) {
      return html.replace(/<\/body>/i, `${pixelTag}</body>`)
    }

    return `${html}${pixelTag}`
  }

  getTransparentTrackingPixelBuffer() {
    return Buffer.from(EmailMarketingModuleService.trackingPixelTransparentGifBase64, "base64")
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

  private normalizeAggregate(row: Record<string, number | string | null | undefined> | null | undefined): CampaignLiveAggregate {
    return {
      total_recipients: Number(row?.total_recipients || 0),
      sent_count: Number(row?.sent_count || 0),
      delivered_count: Number(row?.delivered_count || 0),
      failed_count: Number(row?.failed_count || 0),
      opened_count: Number(row?.opened_count || 0),
      clicked_count: Number(row?.clicked_count || 0),
    }
  }

  private mergeAggregates(base: CampaignLiveAggregate, extra: CampaignLiveAggregate): CampaignLiveAggregate {
    return {
      total_recipients: base.total_recipients + extra.total_recipients,
      sent_count: base.sent_count + extra.sent_count,
      delivered_count: base.delivered_count + extra.delivered_count,
      failed_count: base.failed_count + extra.failed_count,
      opened_count: base.opened_count + extra.opened_count,
      clicked_count: base.clicked_count + extra.clicked_count,
    }
  }

  private shouldPromoteStatus(currentStatus: CampaignDeliveryStatus, nextStatus: CampaignDeliveryStatus) {
    if (currentStatus === nextStatus) {
      return false
    }

    if (nextStatus === "failed") {
      return currentStatus === "queued" || currentStatus === "sent"
    }

    if (currentStatus === "failed") {
      return nextStatus !== "queued"
    }

    return this.statusPriority[nextStatus] > this.statusPriority[currentStatus]
  }

  private filterSubscribersByAudience(subscribers: any[], audienceFilter: CampaignAudienceFilter | null | undefined) {
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

      try {
        await this.createEmailCampaignLogs(
          {
            campaign_id: campaign.id,
            subscriber_id: input.subscriber_id,
            status: "queued",
          },
          sharedContext
        )
      } catch (error) {
        const errorMessage = this.getErrorMessage(error)

        if (!errorMessage.toLowerCase().includes("duplicate")) {
          throw error
        }
      }
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
      notification_module_service?: INotificationModuleService
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

      if (input.notification_module_service) {
        await this.processQueuedAutomatedCampaignLogs(input.notification_module_service, sharedContext)
      }

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

    if (input.notification_module_service) {
      await this.processQueuedAutomatedCampaignLogs(input.notification_module_service, sharedContext)
    }

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
    const parsedScheduledAt = input.scheduled_at ? new Date(input.scheduled_at) : null
    if (parsedScheduledAt && Number.isNaN(parsedScheduledAt.getTime())) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid scheduled_at datetime")
    }
    const audienceFilter = this.normalizeAudienceFilter(input.audience_filter as CampaignAudienceFilter)
    const status = (input.status as CampaignStatus | undefined) || (parsedScheduledAt ? "scheduled" : "draft")

    if (status !== "draft" && status !== "scheduled" && status !== "automated") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid campaign status")
    }

    this.assertCampaignConfig({
      status,
      scheduled_at: parsedScheduledAt,
      audience_filter: audienceFilter,
    })

    return this.createEmailCampaigns(
      {
        ...input,
        template_id: input.template_id,
        status,
        scheduled_at: parsedScheduledAt,
        audience_filter: audienceFilter,
      },
      sharedContext
    )
  }

  @InjectManager()
  async updateCampaignDraft(
    campaignId: string,
    input: {
      name?: string
      subject?: string
      sender_name?: string
      sender_email?: string
      template_id?: string
      scheduled_at?: string | null
      audience_filter?: Record<string, unknown>
      status?: "draft" | "scheduled" | "automated" | "failed"
      metadata?: Record<string, unknown>
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)
    const nextStatus = (input.status || campaign.status) as CampaignStatus
    const nextScheduledAt =
      input.scheduled_at !== undefined
        ? input.scheduled_at
          ? new Date(input.scheduled_at)
          : null
        : campaign.scheduled_at
    if (nextScheduledAt && Number.isNaN(new Date(nextScheduledAt).getTime())) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid scheduled_at datetime")
    }

    const nextAudienceFilter = this.normalizeAudienceFilter(
      (input.audience_filter as CampaignAudienceFilter | undefined) ||
        ((campaign.audience_filter as CampaignAudienceFilter) || {})
    )

    if (nextStatus === "sent" || nextStatus === "processing") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign status cannot be set directly to this value")
    }

    if (nextStatus !== "failed") {
      this.assertCampaignConfig({
        status: nextStatus,
        scheduled_at: nextScheduledAt,
        audience_filter: nextAudienceFilter,
      })
    }

    return this.updateEmailCampaigns(
      {
        id: campaignId,
        ...input,
        status: nextStatus,
        scheduled_at: nextStatus === "scheduled" ? nextScheduledAt : null,
        audience_filter: nextAudienceFilter,
      } as any,
      sharedContext
    )
  }

  @InjectManager()
  async queueCampaignSend(
    campaignId: string,
    notificationModuleService: INotificationModuleService,
    options: QueueCampaignSendOptions = {},
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)

    if (!campaign.template_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign template is required")
    }
    const template = await this.retrieveEmailTemplate(campaign.template_id, {}, sharedContext)

    if (!options.allow_already_sent && campaign.status === "sent") {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Campaign has already been sent")
    }

    const audienceFilter = this.normalizeAudienceFilter((campaign.audience_filter as CampaignAudienceFilter) || {})
    const activeSubscribers = await this.listSubscribers({ status: "active" }, {}, sharedContext)
    const audienceSubscribers = this.filterSubscribersByAudience(activeSubscribers, audienceFilter)
    const filteredSubscribers = options.subscriber_ids?.length
      ? audienceSubscribers.filter((subscriber) => options.subscriber_ids?.includes(subscriber.id))
      : audienceSubscribers

    if (!filteredSubscribers.length) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No matching subscribers for this campaign audience")
    }

    if (!options.skip_processing_status_update) {
      await this.updateEmailCampaigns({ id: campaign.id, status: "processing" }, sharedContext)
    }

    const existingLogs = await this.listEmailCampaignLogs(
      { campaign_id: campaign.id },
      { take: Math.max(filteredSubscribers.length * 2, 1000) },
      sharedContext
    )
    const existingBySubscriber = new Map(existingLogs.map((log) => [log.subscriber_id, log]))

    const logsToCreate = filteredSubscribers
      .filter((subscriber) => !existingBySubscriber.has(subscriber.id))
      .map((subscriber) => ({
        campaign_id: campaign.id,
        subscriber_id: subscriber.id,
        status: "queued",
      }))
    const createdLogs =
      logsToCreate.length > 0 ? await this.createEmailCampaignLogs(logsToCreate, sharedContext) : []

    const logs = Array.isArray(createdLogs) ? createdLogs : createdLogs ? [createdLogs] : []
    const logBySubscriberId = new Map(
      [...existingLogs, ...logs]
        .filter((log) => filteredSubscribers.some((subscriber) => subscriber.id === log.subscriber_id))
        .map((log) => [log.subscriber_id, log])
    )
    let sentCount = 0
    let failedCount = 0

    for (const subscriber of filteredSubscribers) {
      const log = logBySubscriberId.get(subscriber.id)

      if (!log) {
        continue
      }

      if (["sent", "delivered", "opened", "clicked"].includes(String(log.status))) {
        continue
      }

      try {
        const openTrackingToken = this.buildOpenTrackingToken(campaign.id, subscriber.id)
        const trackingBaseUrl = this.getTrackingBaseUrl()
        const openTrackingUrl = `${trackingBaseUrl}/store/email-marketing/campaigns/open?t=${encodeURIComponent(openTrackingToken)}`
        const trackedHtml = this.appendTrackingPixel(template.html_content, openTrackingUrl)

        await notificationModuleService.createNotifications({
          to: subscriber.email,
          channel: "email",
          template: "email-marketing-campaign",
          data: {
            campaign_id: campaign.id,
            campaign_name: campaign.name,
            subscriber_id: subscriber.id,
            subscriber_email: subscriber.email,
            open_tracking_url: openTrackingUrl,
          },
          content: {
            subject: campaign.subject || template.subject,
            html: trackedHtml,
            text: template.text_content || undefined,
          },
        })

        await this.updateEmailCampaignLogs(
          {
            id: log.id,
            status: "sent",
            error_message: null,
            delivered_at: null,
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
        failedCount += 1
      }
    }

    if (campaign.status === "automated") {
      return this.updateEmailCampaigns(
        {
          id: campaign.id,
          status: "automated",
        },
        sharedContext
      )
    }

    return this.updateEmailCampaigns(
      {
        id: campaign.id,
        status: failedCount > 0 ? "failed" : sentCount > 0 ? "sent" : "failed",
        sent_at: failedCount === 0 && sentCount > 0 ? new Date() : null,
      },
      sharedContext
    )
  }

  @InjectManager()
  async processDueScheduledCampaigns(
    notificationModuleService: INotificationModuleService,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const claimedRows =
      (await manager?.execute(
        `
          update email_campaign
          set status = 'processing',
              updated_at = now()
          where id in (
            select id
            from email_campaign
            where deleted_at is null
              and status = 'scheduled'
              and sent_at is null
              and scheduled_at is not null
              and scheduled_at <= now()
            order by scheduled_at asc
            limit 200
          )
          returning id
        `
      )) || []

    const claimedCampaignIds = claimedRows
      .map((row) => String((row as { id?: string }).id || ""))
      .filter(Boolean)
    let processedCount = 0

    for (const campaignId of claimedCampaignIds) {
      await this.queueCampaignSend(
        campaignId,
        notificationModuleService,
        { allow_already_sent: false, skip_processing_status_update: true },
        sharedContext
      )
      processedCount += 1
    }

    return { processed_count: processedCount }
  }

  @InjectManager()
  async processQueuedAutomatedCampaignLogs(
    notificationModuleService: INotificationModuleService,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const queuedLogs = await this.listEmailCampaignLogs(
      {
        status: "queued",
      },
      {
        take: 500,
        order: { created_at: "ASC" },
      },
      sharedContext
    )

    const automatedCampaignIds = Array.from(new Set(queuedLogs.map((log) => String(log.campaign_id))))
    let processedCount = 0

    for (const campaignId of automatedCampaignIds) {
      const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)

      if (campaign.status !== "automated") {
        continue
      }

      const subscriberIds = queuedLogs
        .filter((log) => String(log.campaign_id) === campaignId)
        .map((log) => log.subscriber_id)

      if (!subscriberIds.length) {
        continue
      }

      await this.queueCampaignSend(
        campaignId,
        notificationModuleService,
        {
          subscriber_ids: subscriberIds,
          allow_already_sent: true,
        },
        sharedContext
      )
      processedCount += subscriberIds.length
    }

    return { processed_count: processedCount }
  }

  @InjectManager()
  async listCampaignEmailAnalyticsLogs(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager
    const result = await manager?.execute(
      `
      select
        log.id,
        log.campaign_id,
        log.subscriber_id,
        s.email as subscriber_email,
        s.first_name as subscriber_first_name,
        s.last_name as subscriber_last_name,
        log.status,
        log.error_message,
        log.provider_message_id,
        log.created_at,
        log.updated_at,
        log.delivered_at,
        log.opened_at,
        log.clicked_at
      from email_campaign_log as log
      left join email_subscriber as s on s.id = log.subscriber_id and s.deleted_at is null
      where log.deleted_at is null
        and log.campaign_id = ?
      order by log.created_at desc
      `,
      [campaignId]
    )

    return (result || []).map((row) => ({
      id: String((row as Record<string, unknown>).id || ""),
      campaign_id: String((row as Record<string, unknown>).campaign_id || ""),
      subscriber_id: String((row as Record<string, unknown>).subscriber_id || ""),
      subscriber_email: (row as Record<string, unknown>).subscriber_email || null,
      subscriber_first_name: (row as Record<string, unknown>).subscriber_first_name || null,
      subscriber_last_name: (row as Record<string, unknown>).subscriber_last_name || null,
      status: String((row as Record<string, unknown>).status || "queued") as CampaignDeliveryStatus,
      error_message: (row as Record<string, unknown>).error_message || null,
      provider_message_id: (row as Record<string, unknown>).provider_message_id || null,
      created_at: (row as Record<string, unknown>).created_at || null,
      updated_at: (row as Record<string, unknown>).updated_at || null,
      delivered_at: (row as Record<string, unknown>).delivered_at || null,
      opened_at: (row as Record<string, unknown>).opened_at || null,
      clicked_at: (row as Record<string, unknown>).clicked_at || null,
    }))
  }

  @InjectManager()
  async applyCampaignDeliveryEvent(
    input: {
      campaign_id: string
      subscriber_id?: string
      subscriber_email?: string
      provider_message_id?: string | null
      status: CampaignDeliveryStatus
      event_at?: Date | string | null
      error_message?: string | null
      metadata?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const normalizedEmail = input.subscriber_email?.trim().toLowerCase() || ""
    let subscriberId = input.subscriber_id?.trim() || ""

    if (!subscriberId && normalizedEmail) {
      const matchedSubscribers = await this.listSubscribers({ email: normalizedEmail }, { take: 1 }, sharedContext)
      subscriberId = matchedSubscribers[0]?.id || ""
    }

    if (!subscriberId) {
      return { updated: false, reason: "subscriber_not_found" as const }
    }

    const matchedLogs = await this.listEmailCampaignLogs(
      {
        campaign_id: input.campaign_id,
        subscriber_id: subscriberId,
      },
      {
        take: 1,
      },
      sharedContext
    )

    if (!matchedLogs.length) {
      return { updated: false, reason: "log_not_found" as const }
    }

    const log = matchedLogs[0]
    const currentStatus = String(log.status || "queued") as CampaignDeliveryStatus
    const nextStatus = input.status

    if (!this.shouldPromoteStatus(currentStatus, nextStatus)) {
      return { updated: false, reason: "status_not_promoted" as const }
    }

    const eventDate = input.event_at ? new Date(input.event_at) : new Date()

    await this.updateEmailCampaignLogs(
      {
        id: log.id,
        status: nextStatus,
        provider_message_id: input.provider_message_id ?? log.provider_message_id ?? null,
        error_message: input.error_message ?? (nextStatus === "failed" ? "Email delivery failed" : null),
        delivered_at: ["delivered", "opened", "clicked"].includes(nextStatus) ? eventDate : log.delivered_at,
        opened_at: ["opened", "clicked"].includes(nextStatus) ? eventDate : log.opened_at,
        clicked_at: nextStatus === "clicked" ? eventDate : log.clicked_at,
        metadata: {
          ...((log.metadata as Record<string, unknown>) || {}),
          ...(input.metadata || {}),
          last_event_at: eventDate.toISOString(),
          last_event_status: nextStatus,
        },
      },
      sharedContext
    )

    return { updated: true, reason: "updated" as const, subscriber_id: subscriberId, log_id: log.id }
  }

  async applyOpenTrackingToken(
    token: string,
    metadata: Record<string, unknown> | null = null,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const decoded = this.decodeOpenTrackingToken(token)

    if (!decoded) {
      return { updated: false, reason: "invalid_token" as const }
    }

    return this.applyCampaignDeliveryEvent(
      {
        campaign_id: decoded.campaign_id,
        subscriber_id: decoded.subscriber_id,
        status: "opened",
        event_at: new Date(),
        metadata: {
          ...(metadata || {}),
          tracking_source: "pixel",
        },
      },
      sharedContext
    )
  }

  @InjectManager()
  async getLiveCampaignAnalyticsAggregate(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
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

    return this.normalizeAggregate((result?.[0] || {}) as Record<string, number>)
  }

  @InjectManager()
  async clearCampaignAnalyticsLogs(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)

    if (campaign.status === "processing" || campaign.status === "automated") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Analytics logs can only be cleared for campaigns that are not processing or automated"
      )
    }

    const manager = sharedContext?.manager
    const liveAggregate = await this.getLiveCampaignAnalyticsAggregate(campaignId, sharedContext)
    const metadata = (campaign.metadata as Record<string, unknown>) || {}
    const archivedMetrics = this.normalizeAggregate((metadata.analytics_archive as Record<string, number>) || {})
    const nextArchivedMetrics = this.mergeAggregates(archivedMetrics, liveAggregate)

    await manager?.execute(
      `
      update email_campaign_log
      set deleted_at = now(),
          updated_at = now()
      where campaign_id = ?
        and deleted_at is null
      `,
      [campaignId]
    )

    await this.updateEmailCampaigns(
      {
        id: campaignId,
        metadata: {
          ...metadata,
          analytics_archive: nextArchivedMetrics,
          analytics_logs_last_cleared_at: new Date().toISOString(),
        },
      },
      sharedContext
    )

    return { cleared_count: liveAggregate.total_recipients, archived_analytics: nextArchivedMetrics }
  }

  @InjectManager()
  async getCampaignAnalytics(campaignId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const campaign = await this.retrieveEmailCampaign(campaignId, {}, sharedContext)
    const liveAggregate = await this.getLiveCampaignAnalyticsAggregate(campaignId, sharedContext)
    const metadata = (campaign.metadata as Record<string, unknown>) || {}
    const archivedAggregate = this.normalizeAggregate((metadata.analytics_archive as Record<string, number>) || {})
    const aggregate = this.mergeAggregates(archivedAggregate, liveAggregate)
    const total = aggregate.total_recipients

    return {
      total_recipients: total,
      sent_count: aggregate.sent_count,
      delivered_count: aggregate.delivered_count,
      failed_count: aggregate.failed_count,
      open_rate: total > 0 ? aggregate.opened_count / total : 0,
      click_rate: total > 0 ? aggregate.clicked_count / total : 0,
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
