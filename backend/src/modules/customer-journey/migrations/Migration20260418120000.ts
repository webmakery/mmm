import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260418120000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "journey_visitor" (
      "id" text not null,
      "anonymous_id" text not null,
      "first_seen_at" timestamptz not null,
      "last_seen_at" timestamptz not null,
      "first_referrer" text null,
      "first_landing_page" text null,
      "first_utm_source" text null,
      "first_utm_medium" text null,
      "first_utm_campaign" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_visitor_pkey" primary key ("id"),
      constraint "journey_visitor_anonymous_id_unique" unique ("anonymous_id")
    );`)

    this.addSql(`create table if not exists "journey_session" (
      "id" text not null,
      "session_id" text not null,
      "visitor_id" text not null,
      "started_at" timestamptz not null,
      "last_seen_at" timestamptz not null,
      "landing_page" text null,
      "referrer" text null,
      "utm_source" text null,
      "utm_medium" text null,
      "utm_campaign" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_session_pkey" primary key ("id"),
      constraint "journey_session_session_id_unique" unique ("session_id"),
      constraint "journey_session_visitor_id_foreign" foreign key ("visitor_id") references "journey_visitor" ("id") on update cascade on delete cascade
    );`)

    this.addSql(`create index if not exists "IDX_JOURNEY_SESSION_VISITOR" on "journey_session" (visitor_id) where deleted_at is null;`)

    this.addSql(`create table if not exists "journey_event" (
      "id" text not null,
      "event_id" text not null,
      "idempotency_key" text not null,
      "event_name" text not null,
      "occurred_at" timestamptz not null,
      "visitor_id" text not null,
      "session_id" text null,
      "customer_id" text null,
      "event_source" text null,
      "page_url" text null,
      "referrer" text null,
      "utm_source" text null,
      "utm_medium" text null,
      "utm_campaign" text null,
      "payload" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_event_pkey" primary key ("id"),
      constraint "journey_event_event_id_unique" unique ("event_id"),
      constraint "journey_event_idempotency_key_unique" unique ("idempotency_key"),
      constraint "journey_event_visitor_id_foreign" foreign key ("visitor_id") references "journey_visitor" ("id") on update cascade on delete cascade,
      constraint "journey_event_session_id_foreign" foreign key ("session_id") references "journey_session" ("id") on update cascade on delete set null
    );`)

    this.addSql(`create index if not exists "IDX_JOURNEY_EVENT_NAME" on "journey_event" (event_name) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_EVENT_CUSTOMER_ID" on "journey_event" (customer_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_EVENT_VISITOR" on "journey_event" (visitor_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_EVENT_SESSION" on "journey_event" (session_id) where deleted_at is null;`)

    this.addSql(`create table if not exists "journey_identity_link" (
      "id" text not null,
      "visitor_id" text not null,
      "customer_id" text not null,
      "linked_at" timestamptz not null,
      "source" text null,
      "dedupe_key" text not null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_identity_link_pkey" primary key ("id"),
      constraint "journey_identity_link_dedupe_key_unique" unique ("dedupe_key"),
      constraint "journey_identity_link_visitor_id_foreign" foreign key ("visitor_id") references "journey_visitor" ("id") on update cascade on delete cascade
    );`)

    this.addSql(`create index if not exists "IDX_JOURNEY_IDENTITY_VISITOR" on "journey_identity_link" (visitor_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_IDENTITY_CUSTOMER" on "journey_identity_link" (customer_id) where deleted_at is null;`)

    this.addSql(`create table if not exists "journey_customer_rollup" (
      "id" text not null,
      "customer_id" text not null,
      "first_seen_at" timestamptz null,
      "first_signup_at" timestamptz null,
      "first_order_at" timestamptz null,
      "first_payment_captured_at" timestamptz null,
      "total_sessions" integer not null default 0,
      "total_events" integer not null default 0,
      "signup_started_at" timestamptz null,
      "signup_completed_at" timestamptz null,
      "last_event_at" timestamptz null,
      "last_event_name" text null,
      "latest_source" text null,
      "latest_medium" text null,
      "latest_campaign" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_customer_rollup_pkey" primary key ("id"),
      constraint "journey_customer_rollup_customer_id_unique" unique ("customer_id")
    );`)

    this.addSql(`create table if not exists "journey_attribution_touch" (
      "id" text not null,
      "customer_id" text not null,
      "visitor_id" text null,
      "session_id" text null,
      "touched_at" timestamptz not null,
      "touch_type" text not null,
      "source" text null,
      "medium" text null,
      "campaign" text null,
      "landing_page" text null,
      "referrer" text null,
      "dedupe_key" text not null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_attribution_touch_pkey" primary key ("id"),
      constraint "journey_attribution_touch_dedupe_key_unique" unique ("dedupe_key")
    );`)

    this.addSql(`create index if not exists "IDX_JOURNEY_TOUCH_CUSTOMER" on "journey_attribution_touch" (customer_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_TOUCH_VISITOR" on "journey_attribution_touch" (visitor_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_TOUCH_SESSION" on "journey_attribution_touch" (session_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_TOUCH_TYPE" on "journey_attribution_touch" (touch_type) where deleted_at is null;`)

    this.addSql(`create table if not exists "journey_crm_sync_log" (
      "id" text not null,
      "customer_id" text not null,
      "sync_key" text not null,
      "status" text not null,
      "attempted_at" timestamptz not null,
      "payload_summary" jsonb null,
      "response_summary" jsonb null,
      "error_message" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "journey_crm_sync_log_pkey" primary key ("id"),
      constraint "journey_crm_sync_log_sync_key_unique" unique ("sync_key")
    );`)

    this.addSql(`create index if not exists "IDX_JOURNEY_CRM_CUSTOMER" on "journey_crm_sync_log" (customer_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_JOURNEY_CRM_STATUS" on "journey_crm_sync_log" (status) where deleted_at is null;`)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "journey_crm_sync_log" cascade;')
    this.addSql('drop table if exists "journey_attribution_touch" cascade;')
    this.addSql('drop table if exists "journey_customer_rollup" cascade;')
    this.addSql('drop table if exists "journey_identity_link" cascade;')
    this.addSql('drop table if exists "journey_event" cascade;')
    this.addSql('drop table if exists "journey_session" cascade;')
    this.addSql('drop table if exists "journey_visitor" cascade;')
  }
}
