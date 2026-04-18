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
  payload?: Record<string, unknown> | null
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
      utm_source?: string | null
      utm_medium?: string | null
      utm_campaign?: string | null
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
          metadata, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
        on conflict (session_id) do update set
          last_seen_at = excluded.last_seen_at,
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

    const visitor = await this.upsertVisitor(
      {
        anonymous_id: input.anonymous_id,
        occurred_at: occurredAt,
        landing_page: input.page_url,
        referrer: input.referrer,
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
            utm_source: input.utm_source,
            utm_medium: input.utm_medium,
            utm_campaign: input.utm_campaign,
          },
          sharedContext
        )
      : null

    const eventId = input.event_id || `${input.event_name}:${input.anonymous_id}:${occurredAt.toISOString()}`
    const idempotencyKey =
      input.idempotency_key || `${input.event_name}:${input.anonymous_id}:${input.session_id || "no-session"}:${eventId}`

    const rows = await manager?.execute(
      `insert into journey_event (
          id, event_id, idempotency_key, event_name, occurred_at,
          visitor_id, session_id, customer_id, event_source,
          page_url, referrer, utm_source, utm_medium, utm_campaign,
          payload, created_at, updated_at
        ) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, now(), now())
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
        input.customer_id ?? null,
        input.event_source ?? null,
        input.page_url ?? null,
        input.referrer ?? null,
        input.utm_source ?? null,
        input.utm_medium ?? null,
        input.utm_campaign ?? null,
        JSON.stringify(input.payload ?? null),
      ]
    )

    return rows?.[0] ?? null
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
      `select
        min(e.occurred_at) as first_seen_at,
        min(case when e.event_name = 'signup_completed' then e.occurred_at end) as first_signup_at,
        min(case when e.event_name = 'order_placed' then e.occurred_at end) as first_order_at,
        min(case when e.event_name = 'payment_captured' then e.occurred_at end) as first_payment_captured_at,
        min(case when e.event_name = 'signup_started' then e.occurred_at end) as signup_started_at,
        min(case when e.event_name = 'signup_completed' then e.occurred_at end) as signup_completed_at,
        max(e.occurred_at) as last_event_at,
        (array_agg(e.event_name order by e.occurred_at desc))[1] as last_event_name,
        (array_agg(e.utm_source order by e.occurred_at desc))[1] as latest_source,
        (array_agg(e.utm_medium order by e.occurred_at desc))[1] as latest_medium,
        (array_agg(e.utm_campaign order by e.occurred_at desc))[1] as latest_campaign,
        count(*)::int as total_events,
        count(distinct e.session_id)::int as total_sessions
      from journey_event e
      where e.deleted_at is null
        and (
          e.customer_id = ?
          or exists (
            select 1
            from journey_identity_link l
            where l.visitor_id = e.visitor_id
              and l.customer_id = ?
              and l.deleted_at is null
          )
        )`,
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
        JSON.stringify({ recomputed_at: new Date().toISOString() }),
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

    if (input.customer_id) {
      await this.recomputeCustomerRollup(input.customer_id, sharedContext)
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
