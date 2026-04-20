import { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { Context } from "@medusajs/framework/types"
import { InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import JourneyAttributionTouch from "./models/journey-attribution-touch"
import JourneyCrmSyncLog from "./models/journey-crm-sync-log"
import JourneyCustomerRollup from "./models/journey-customer-rollup"
import JourneyEvent from "./models/journey-event"
import JourneyIdentityLink from "./models/journey-identity-link"
import JourneySession from "./models/journey-session"
import JourneyVisitor from "./models/journey-visitor"
import { StubCustomerJourneyCrmAdapter } from "./crm/stub-adapter"
import { CustomerJourneyCrmAdapter } from "./crm/types"

type JourneyEventInput = {
  anonymous_id: string
  session_id?: string | null
  event_name: string
  event_id?: string | null
  idempotency_key?: string | null
  occurred_at?: string | Date | null
  customer_id?: string | null
  event_source?: string | null
  page_url?: string | null
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  utm_term?: string | null
  utm_content?: string | null
  payload?: Record<string, unknown> | null
}

const normalizeText = (value?: string | null) => {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

const getReferrerHost = (referrer?: string | null) => {
  const raw = normalizeText(referrer)
  if (!raw) {
    return null
  }

  try {
    return new URL(raw).hostname || null
  } catch {
    return null
  }
}

const deriveNormalizedAttribution = (input: {
  utm_source?: string | null
  utm_medium?: string | null
  referrer_host?: string | null
}) => {
  const utmSource = normalizeText(input.utm_source)?.toLowerCase()
  const utmMedium = normalizeText(input.utm_medium)?.toLowerCase()
  const referrerHost = normalizeText(input.referrer_host)?.toLowerCase()

  if (utmSource || utmMedium) {
    return {
      source: utmSource ?? referrerHost ?? "direct",
      medium: utmMedium ?? "utm",
    }
  }

  if (referrerHost) {
    return {
      source: referrerHost,
      medium: "referral",
    }
  }

  return {
    source: "direct",
    medium: "none",
  }
}

type IdentifyUserInput = {
  anonymous_id: string
  customer_id: string
  source?: string | null
  session_id?: string | null
  metadata?: Record<string, unknown> | null
}

class CustomerJourneyModuleService extends MedusaService({
  JourneyVisitor,
  JourneySession,
  JourneyEvent,
  JourneyIdentityLink,
  JourneyCustomerRollup,
  JourneyAttributionTouch,
  JourneyCrmSyncLog,
}) {
  private readonly crmAdapter: CustomerJourneyCrmAdapter = new StubCustomerJourneyCrmAdapter()

  @InjectManager()
  async upsertVisitor(
    input: {
      anonymous_id: string
      occurred_at?: Date
      referrer?: string | null
      landing_page?: string | null
      referrer_host?: string | null
      utm_source?: string | null
      utm_medium?: string | null
      utm_campaign?: string | null
      metadata?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const occurredAt = input.occurred_at ?? new Date()

    const rows = await manager?.execute(
      `insert into journey_visitor (
          id, anonymous_id, first_seen_at, last_seen_at,
          first_referrer, first_landing_page, first_utm_source, first_utm_medium, first_utm_campaign,
          metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (anonymous_id) do update set
          last_seen_at = excluded.last_seen_at,
          updated_at = now(),
          metadata = coalesce(journey_visitor.metadata, excluded.metadata)
        returning *`,
      [
        `jv_${input.anonymous_id}`,
        input.anonymous_id,
        occurredAt,
        occurredAt,
        input.referrer ?? null,
        input.landing_page ?? null,
        input.utm_source ?? null,
        input.utm_medium ?? null,
        input.utm_campaign ?? null,
        JSON.stringify(input.metadata ?? null),
      ]
    )

    return rows?.[0]
  }

  @InjectManager()
  async upsertSession(
    input: {
      anonymous_id: string
      session_id: string
      occurred_at?: Date
      landing_page?: string | null
      referrer?: string | null
      referrer_host?: string | null
      utm_source?: string | null
      utm_medium?: string | null
      utm_campaign?: string | null
      utm_term?: string | null
      utm_content?: string | null
      normalized_source?: string | null
      normalized_medium?: string | null
      metadata?: Record<string, unknown> | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const occurredAt = input.occurred_at ?? new Date()

    const visitor = await this.upsertVisitor(
      {
        anonymous_id: input.anonymous_id,
        occurred_at: occurredAt,
        landing_page: input.landing_page,
        referrer: input.referrer,
        referrer_host: input.referrer_host,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
        metadata: input.metadata,
      },
      sharedContext
    )
    if (!visitor?.id) {
      throw new Error("Failed to upsert journey visitor")
    }

    const rows = await manager?.execute(
      `insert into journey_session (
          id, session_id, visitor_id, started_at, last_seen_at,
          landing_page, referrer, utm_source, utm_medium, utm_campaign,
          referrer_host, utm_term, utm_content, normalized_source, normalized_medium,
          metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (session_id) do update set
          last_seen_at = excluded.last_seen_at,
          landing_page = coalesce(journey_session.landing_page, excluded.landing_page),
          referrer = coalesce(journey_session.referrer, excluded.referrer),
          referrer_host = coalesce(journey_session.referrer_host, excluded.referrer_host),
          utm_source = coalesce(journey_session.utm_source, excluded.utm_source),
          utm_medium = coalesce(journey_session.utm_medium, excluded.utm_medium),
          utm_campaign = coalesce(journey_session.utm_campaign, excluded.utm_campaign),
          utm_term = coalesce(journey_session.utm_term, excluded.utm_term),
          utm_content = coalesce(journey_session.utm_content, excluded.utm_content),
          normalized_source = coalesce(journey_session.normalized_source, excluded.normalized_source),
          normalized_medium = coalesce(journey_session.normalized_medium, excluded.normalized_medium),
          updated_at = now(),
          metadata = coalesce(journey_session.metadata, excluded.metadata)
        returning *`,
      [
        `js_${input.session_id}`,
        input.session_id,
        visitor.id,
        occurredAt,
        occurredAt,
        input.landing_page ?? null,
        input.referrer ?? null,
        input.utm_source ?? null,
        input.utm_medium ?? null,
        input.utm_campaign ?? null,
        input.referrer_host ?? null,
        input.utm_term ?? null,
        input.utm_content ?? null,
        input.normalized_source ?? null,
        input.normalized_medium ?? null,
        JSON.stringify(input.metadata ?? null),
      ]
    )

    return rows?.[0]
  }

  @InjectManager()
  async appendEvent(
    input: JourneyEventInput,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const occurredAt = input.occurred_at ? new Date(input.occurred_at) : new Date()
    const referrerHost = getReferrerHost(input.referrer)
    const normalized = deriveNormalizedAttribution({
      utm_source: input.utm_source,
      utm_medium: input.utm_medium,
      referrer_host: referrerHost,
    })

    const visitor = await this.upsertVisitor(
      {
        anonymous_id: input.anonymous_id,
        occurred_at: occurredAt,
        landing_page: input.page_url,
        referrer: input.referrer,
        referrer_host: referrerHost,
        utm_source: input.utm_source,
        utm_medium: input.utm_medium,
        utm_campaign: input.utm_campaign,
      },
      sharedContext
    )
    if (!visitor?.id) {
      throw new Error("Failed to upsert journey visitor")
    }

    const session = input.session_id
      ? await this.upsertSession(
          {
            anonymous_id: input.anonymous_id,
            session_id: input.session_id,
            occurred_at: occurredAt,
            landing_page: input.page_url,
            referrer: input.referrer,
            referrer_host: referrerHost,
            utm_source: input.utm_source,
            utm_medium: input.utm_medium,
            utm_campaign: input.utm_campaign,
            utm_term: input.utm_term,
            utm_content: input.utm_content,
            normalized_source: normalized.source,
            normalized_medium: normalized.medium,
          },
          sharedContext
        )
      : null

    const eventId = input.event_id || `${input.event_name}:${input.anonymous_id}:${occurredAt.toISOString()}`
    const idempotencyKey =
      input.idempotency_key || `${input.event_name}:${input.anonymous_id}:${input.session_id || "no-session"}:${eventId}`
    const linkedCustomerRows =
      !input.customer_id && visitor?.id
        ? await manager?.execute(
            `select customer_id
             from journey_identity_link
             where visitor_id = ? and deleted_at is null
             order by linked_at desc, created_at desc
             limit 1`,
            [visitor.id]
          )
        : []
    const resolvedCustomerId = input.customer_id ?? linkedCustomerRows?.[0]?.customer_id ?? null

    const rows = await manager?.execute(
      `insert into journey_event (
          id, event_id, idempotency_key, event_name, occurred_at,
          visitor_id, session_id, customer_id, event_source,
          page_url, referrer, referrer_host, utm_source, utm_medium, utm_campaign,
          utm_term, utm_content, normalized_source, normalized_medium,
          payload, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (idempotency_key) do nothing
        returning *`,
      [
        `je_${eventId}`,
        eventId,
        idempotencyKey,
        input.event_name,
        occurredAt,
        visitor.id,
        session?.id ?? null,
        resolvedCustomerId,
        input.event_source ?? null,
        input.page_url ?? null,
        input.referrer ?? null,
        referrerHost,
        input.utm_source ?? null,
        input.utm_medium ?? null,
        input.utm_campaign ?? null,
        input.utm_term ?? null,
        input.utm_content ?? null,
        normalized.source,
        normalized.medium,
        JSON.stringify(input.payload ?? null),
      ]
    )

    if (rows?.[0]) {
      await this.refreshVisitorAttribution(visitor.id, sharedContext)
    }

    if (rows?.[0] && resolvedCustomerId) {
      await this.upsertAttributionTouch(
        {
          customer_id: resolvedCustomerId,
          visitor_id: visitor.id,
          session_id: session?.id ?? null,
          touched_at: occurredAt,
          source: normalized.source,
          medium: normalized.medium,
          campaign: input.utm_campaign ?? null,
          term: input.utm_term ?? null,
          content: input.utm_content ?? null,
          landing_page: input.page_url ?? null,
          referrer: input.referrer ?? null,
          referrer_host: referrerHost,
        },
        sharedContext
      )

    }

    return rows?.[0] ?? null
  }

  @InjectManager()
  async upsertAttributionTouch(
    input: {
      customer_id: string
      visitor_id?: string | null
      session_id?: string | null
      touched_at: Date
      source: string
      medium: string
      campaign?: string | null
      term?: string | null
      content?: string | null
      landing_page?: string | null
      referrer?: string | null
      referrer_host?: string | null
    },
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager

    const firstTouch = await manager?.execute(
      `select id, touched_at
       from journey_attribution_touch
       where customer_id = ? and touch_type = 'first_touch' and deleted_at is null
       limit 1`,
      [input.customer_id]
    )

    const first = firstTouch?.[0]
    if (!first || new Date(input.touched_at) < new Date(first.touched_at)) {
      await manager?.execute(
        `insert into journey_attribution_touch (
            id, customer_id, visitor_id, session_id, touched_at, touch_type,
            source, medium, campaign, term, content, landing_page, referrer, referrer_host,
            dedupe_key, metadata, created_at, updated_at
          ) values (?, ?, ?, ?, ?, 'first_touch', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
          on conflict (dedupe_key) do update set
            visitor_id = excluded.visitor_id,
            session_id = excluded.session_id,
            touched_at = excluded.touched_at,
            source = excluded.source,
            medium = excluded.medium,
            campaign = excluded.campaign,
            term = excluded.term,
            content = excluded.content,
            landing_page = excluded.landing_page,
            referrer = excluded.referrer,
            referrer_host = excluded.referrer_host,
            updated_at = now()`,
        [
          `jat:${input.customer_id}:first_touch`,
          input.customer_id,
          input.visitor_id ?? null,
          input.session_id ?? null,
          input.touched_at,
          input.source,
          input.medium,
          input.campaign ?? null,
          input.term ?? null,
          input.content ?? null,
          input.landing_page ?? null,
          input.referrer ?? null,
          input.referrer_host ?? null,
          `${input.customer_id}:first_touch`,
          JSON.stringify({ derived: true }),
        ]
      )
    }

    await manager?.execute(
      `insert into journey_attribution_touch (
          id, customer_id, visitor_id, session_id, touched_at, touch_type,
          source, medium, campaign, term, content, landing_page, referrer, referrer_host,
          dedupe_key, metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, 'last_touch', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (dedupe_key) do update set
          visitor_id = excluded.visitor_id,
          session_id = excluded.session_id,
          touched_at = excluded.touched_at,
          source = excluded.source,
          medium = excluded.medium,
          campaign = excluded.campaign,
          term = excluded.term,
          content = excluded.content,
          landing_page = excluded.landing_page,
          referrer = excluded.referrer,
          referrer_host = excluded.referrer_host,
          updated_at = now()`,
      [
        `jat:${input.customer_id}:last_touch`,
        input.customer_id,
        input.visitor_id ?? null,
        input.session_id ?? null,
        input.touched_at,
        input.source,
        input.medium,
        input.campaign ?? null,
        input.term ?? null,
        input.content ?? null,
        input.landing_page ?? null,
        input.referrer ?? null,
        input.referrer_host ?? null,
        `${input.customer_id}:last_touch`,
        JSON.stringify({ derived: true }),
      ]
    )
  }

  @InjectManager()
  async refreshVisitorAttribution(visitorId: string, @MedusaContext() sharedContext?: Context<EntityManager>) {
    const manager = sharedContext?.manager

    const rows = await manager?.execute(
      `select
          (array_agg(e.referrer order by e.occurred_at asc) filter (where e.referrer is not null))[1] as first_referrer,
          (array_agg(e.page_url order by e.occurred_at asc) filter (where e.page_url is not null))[1] as first_landing_page,
          (array_agg(e.utm_source order by e.occurred_at asc) filter (where e.utm_source is not null))[1] as first_utm_source,
          (array_agg(e.utm_medium order by e.occurred_at asc) filter (where e.utm_medium is not null))[1] as first_utm_medium,
          (array_agg(e.utm_campaign order by e.occurred_at asc) filter (where e.utm_campaign is not null))[1] as first_utm_campaign
       from journey_event e
       where e.visitor_id = ? and e.deleted_at is null`,
      [visitorId]
    )

    const summary = rows?.[0]
    if (!summary) {
      return
    }

    await manager?.execute(
      `update journey_visitor
       set first_referrer = coalesce(?, first_referrer),
           first_landing_page = coalesce(?, first_landing_page),
           first_utm_source = coalesce(?, first_utm_source),
           first_utm_medium = coalesce(?, first_utm_medium),
           first_utm_campaign = coalesce(?, first_utm_campaign),
           updated_at = now()
       where id = ?`,
      [
        summary.first_referrer ?? null,
        summary.first_landing_page ?? null,
        summary.first_utm_source ?? null,
        summary.first_utm_medium ?? null,
        summary.first_utm_campaign ?? null,
        visitorId,
      ]
    )
  }

  @InjectManager()
  async identifyUser(
    input: IdentifyUserInput,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const now = new Date()
    const visitor = await this.upsertVisitor({ anonymous_id: input.anonymous_id, occurred_at: now }, sharedContext)
    if (!visitor?.id) {
      throw new Error("Failed to upsert journey visitor during identify")
    }

    const dedupeKey = `${input.customer_id}:${input.anonymous_id}`
    await manager?.execute(
      `insert into journey_identity_link (
          id, visitor_id, customer_id, linked_at, source, dedupe_key, metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (dedupe_key) do nothing`,
      [
        `jl_${dedupeKey}`,
        visitor.id,
        input.customer_id,
        now,
        input.source ?? "identify",
        dedupeKey,
        JSON.stringify(input.metadata ?? null),
      ]
    )

    await manager?.execute(
      `update journey_event
       set customer_id = ?, updated_at = now()
       where visitor_id = ? and customer_id is null and deleted_at is null`,
      [input.customer_id, visitor.id]
    )

    const historicalTouchRows =
      (await manager?.execute(
      `select *
       from journey_event
       where visitor_id = ? and customer_id = ? and deleted_at is null
         and (normalized_source is not null or utm_source is not null or referrer is not null)
       order by occurred_at asc`,
      [visitor.id, input.customer_id]
    )) || []

    const firstHistoricalTouch = historicalTouchRows?.[0]
    const lastHistoricalTouch = historicalTouchRows[historicalTouchRows.length - 1]

    if (firstHistoricalTouch) {
      await this.upsertAttributionTouch(
        {
          customer_id: input.customer_id,
          visitor_id: visitor.id,
          session_id: firstHistoricalTouch.session_id ?? null,
          touched_at: new Date(firstHistoricalTouch.occurred_at),
          source: firstHistoricalTouch.normalized_source ?? firstHistoricalTouch.utm_source ?? "direct",
          medium: firstHistoricalTouch.normalized_medium ?? firstHistoricalTouch.utm_medium ?? "none",
          campaign: firstHistoricalTouch.utm_campaign ?? null,
          term: firstHistoricalTouch.utm_term ?? null,
          content: firstHistoricalTouch.utm_content ?? null,
          landing_page: firstHistoricalTouch.page_url ?? null,
          referrer: firstHistoricalTouch.referrer ?? null,
          referrer_host: firstHistoricalTouch.referrer_host ?? getReferrerHost(firstHistoricalTouch.referrer),
        },
        sharedContext
      )
    }

    if (lastHistoricalTouch && lastHistoricalTouch !== firstHistoricalTouch) {
      await this.upsertAttributionTouch(
        {
          customer_id: input.customer_id,
          visitor_id: visitor.id,
          session_id: lastHistoricalTouch.session_id ?? null,
          touched_at: new Date(lastHistoricalTouch.occurred_at),
          source: lastHistoricalTouch.normalized_source ?? lastHistoricalTouch.utm_source ?? "direct",
          medium: lastHistoricalTouch.normalized_medium ?? lastHistoricalTouch.utm_medium ?? "none",
          campaign: lastHistoricalTouch.utm_campaign ?? null,
          term: lastHistoricalTouch.utm_term ?? null,
          content: lastHistoricalTouch.utm_content ?? null,
          landing_page: lastHistoricalTouch.page_url ?? null,
          referrer: lastHistoricalTouch.referrer ?? null,
          referrer_host: lastHistoricalTouch.referrer_host ?? getReferrerHost(lastHistoricalTouch.referrer),
        },
        sharedContext
      )
    }

    if (input.session_id) {
      await this.upsertSession(
        {
          anonymous_id: input.anonymous_id,
          session_id: input.session_id,
          occurred_at: now,
        },
        sharedContext
      )
    }

    await this.recomputeCustomerRollup(input.customer_id, sharedContext)
    return { customer_id: input.customer_id, anonymous_id: input.anonymous_id }
  }

  @InjectManager()
  async recomputeCustomerRollup(
    customerId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const summaryRows = await manager?.execute(
      `with touch as (
         select
           max(case when touch_type = 'first_touch' then source end) as first_touch_source,
           max(case when touch_type = 'first_touch' then medium end) as first_touch_medium,
           max(case when touch_type = 'first_touch' then campaign end) as first_touch_campaign,
           max(case when touch_type = 'last_touch' then source end) as latest_source,
           max(case when touch_type = 'last_touch' then medium end) as latest_medium,
           max(case when touch_type = 'last_touch' then campaign end) as latest_campaign
         from journey_attribution_touch
         where customer_id = ? and touch_type in ('first_touch', 'last_touch') and deleted_at is null
       )
       select
        min(e.occurred_at) as first_seen_at,
        min(case when e.event_name = 'signup_completed' then e.occurred_at end) as first_signup_at,
        min(case when e.event_name = 'order_placed' then e.occurred_at end) as first_order_at,
        min(case when e.event_name = 'payment_captured' then e.occurred_at end) as first_payment_captured_at,
        min(case when e.event_name = 'signup_started' then e.occurred_at end) as signup_started_at,
        min(case when e.event_name = 'signup_completed' then e.occurred_at end) as signup_completed_at,
        max(e.occurred_at) as last_event_at,
        (array_agg(e.event_name order by e.occurred_at desc))[1] as last_event_name,
        touch.first_touch_source,
        touch.first_touch_medium,
        touch.first_touch_campaign,
        touch.latest_source,
        touch.latest_medium,
        touch.latest_campaign,
        count(*)::int as total_events,
        count(distinct e.session_id)::int as total_sessions
      from journey_event e
      cross join touch
      where e.customer_id = ? and e.deleted_at is null`,
      [customerId, customerId]
    )

    const summary = summaryRows?.[0]

    if (!summary) {
      return null
    }

    await manager?.execute(
      `insert into journey_customer_rollup (
          id, customer_id, first_seen_at, first_signup_at, first_order_at, first_payment_captured_at,
          total_sessions, total_events, signup_started_at, signup_completed_at,
          last_event_at, last_event_name, latest_source, latest_medium, latest_campaign,
          metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (customer_id) do update set
          first_seen_at = excluded.first_seen_at,
          first_signup_at = excluded.first_signup_at,
          first_order_at = excluded.first_order_at,
          first_payment_captured_at = excluded.first_payment_captured_at,
          total_sessions = excluded.total_sessions,
          total_events = excluded.total_events,
          signup_started_at = excluded.signup_started_at,
          signup_completed_at = excluded.signup_completed_at,
          last_event_at = excluded.last_event_at,
          last_event_name = excluded.last_event_name,
          latest_source = excluded.latest_source,
          latest_medium = excluded.latest_medium,
          latest_campaign = excluded.latest_campaign,
          updated_at = now()`,
      [
        `jr_${customerId}`,
        customerId,
        summary.first_seen_at,
        summary.first_signup_at,
        summary.first_order_at,
        summary.first_payment_captured_at,
        summary.total_sessions ?? 0,
        summary.total_events ?? 0,
        summary.signup_started_at,
        summary.signup_completed_at,
        summary.last_event_at,
        summary.last_event_name,
        summary.latest_source,
        summary.latest_medium,
        summary.latest_campaign,
        JSON.stringify({
          recomputed_at: new Date().toISOString(),
          first_touch_source: summary.first_touch_source ?? null,
          first_touch_medium: summary.first_touch_medium ?? null,
          first_touch_campaign: summary.first_touch_campaign ?? null,
          last_touch_source: summary.latest_source ?? null,
          last_touch_medium: summary.latest_medium ?? null,
          last_touch_campaign: summary.latest_campaign ?? null,
        }),
      ]
    )

    await this.syncCustomerRollupToCrm(customerId, sharedContext)

    return summary
  }

  @InjectManager()
  async syncCustomerRollupToCrm(
    customerId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager
    const rollupRows = await manager?.execute(
      `select * from journey_customer_rollup where customer_id = ? and deleted_at is null limit 1`,
      [customerId]
    )

    const rollup = rollupRows?.[0]

    if (!rollup) {
      return null
    }

    const syncKey = `${customerId}:${rollup.updated_at}`
    const existing = await manager?.execute(
      `select id from journey_crm_sync_log where sync_key = ? limit 1`,
      [syncKey]
    )

    if (existing?.length) {
      return { status: "already_synced" }
    }

    // TODO: move CRM sync into a background queue worker when queue infra is available.
    const crmResponse = await this.crmAdapter.syncCustomerSummary({
      customer_id: customerId,
      first_seen_at: rollup.first_seen_at ? new Date(rollup.first_seen_at).toISOString() : null,
      first_signup_at: rollup.first_signup_at ? new Date(rollup.first_signup_at).toISOString() : null,
      first_order_at: rollup.first_order_at ? new Date(rollup.first_order_at).toISOString() : null,
      first_payment_captured_at: rollup.first_payment_captured_at
        ? new Date(rollup.first_payment_captured_at).toISOString()
        : null,
      latest_source: rollup.latest_source,
      latest_medium: rollup.latest_medium,
      latest_campaign: rollup.latest_campaign,
      total_sessions: rollup.total_sessions ?? 0,
      total_events: rollup.total_events ?? 0,
    })

    await manager?.execute(
      `insert into journey_crm_sync_log (
          id, customer_id, sync_key, status, attempted_at, payload_summary, response_summary, error_message,
          created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?::jsonb, ?::jsonb, ?, now(), now())`,
      [
        `jcrm_${syncKey}`,
        customerId,
        syncKey,
        crmResponse.status,
        new Date(),
        JSON.stringify({ total_events: rollup.total_events, total_sessions: rollup.total_sessions }),
        JSON.stringify(crmResponse),
        crmResponse.status === "skipped" ? crmResponse.message || null : null,
      ]
    )

    return crmResponse
  }

  @InjectManager()
  async ingestEvent(
    input: JourneyEventInput,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const insertedEvent = await this.appendEvent(input, sharedContext)

    const rollupCustomerId = input.customer_id ?? insertedEvent?.customer_id ?? null
    if (rollupCustomerId) {
      await this.recomputeCustomerRollup(rollupCustomerId, sharedContext)
    }

    return {
      inserted: Boolean(insertedEvent),
      event: insertedEvent,
    }
  }

  @InjectManager()
  async getCustomerDebug(
    customerId: string,
    @MedusaContext() sharedContext?: Context<EntityManager>
  ) {
    const manager = sharedContext?.manager

    const [rollup] = (await manager?.execute(
      `select * from journey_customer_rollup where customer_id = ? and deleted_at is null limit 1`,
      [customerId]
    )) || [null]

    const identityLinks =
      (await manager?.execute(
        `select * from journey_identity_link where customer_id = ? and deleted_at is null order by linked_at desc limit 100`,
        [customerId]
      )) || []

    const events =
      (await manager?.execute(
        `select * from journey_event where customer_id = ? and deleted_at is null order by occurred_at desc limit 100`,
        [customerId]
      )) || []

    return {
      customer_id: customerId,
      rollup,
      identity_links: identityLinks,
      recent_events: events,
    }
  }
}

export default CustomerJourneyModuleService
