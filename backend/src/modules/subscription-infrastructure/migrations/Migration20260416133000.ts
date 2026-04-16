import { Migration } from '@mikro-orm/migrations'

export class Migration20260416133000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "provisioning_retry_count" numeric not null default 0;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "last_provisioning_started_at" timestamptz null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "last_provisioning_finished_at" timestamptz null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "failure_diagnostics" jsonb null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "cancelled_at" timestamptz null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "cancelled_by" text null;')

    this.addSql('alter table if exists "subscription_infrastructure" drop constraint if exists "subscription_infrastructure_status_check";')
    this.addSql(`alter table if exists "subscription_infrastructure" add constraint "subscription_infrastructure_status_check" check ("status" in ('pending', 'provisioning', 'active', 'deleting', 'deleted', 'failed', 'cancelled'));`)

    this.addSql(`create table if not exists "subscription_infrastructure_provision_attempt" (
      "id" text not null,
      "infrastructure_id" text not null,
      "attempt_number" numeric not null,
      "triggered_by" text not null,
      "trigger_actor_id" text null,
      "requested_server_type" text null,
      "requested_image" text null,
      "requested_location" text null,
      "provider_server_id" text null,
      "status" text not null,
      "error_message" text null,
      "diagnostics" jsonb null,
      "started_at" timestamptz not null,
      "finished_at" timestamptz null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "subscription_infrastructure_provision_attempt_pkey" primary key ("id")
    );`)
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_subscription_infrastructure_provision_attempt_deleted_at" ON "subscription_infrastructure_provision_attempt" (deleted_at) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_subscription_infra_attempt_infra_id" ON "subscription_infrastructure_provision_attempt" ("infrastructure_id") WHERE deleted_at IS NULL;')

    this.addSql(`create table if not exists "subscription_infrastructure_admin_audit_log" (
      "id" text not null,
      "infrastructure_id" text not null,
      "action" text not null,
      "actor_id" text null,
      "details" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "subscription_infrastructure_admin_audit_log_pkey" primary key ("id")
    );`)
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_subscription_infrastructure_admin_audit_log_deleted_at" ON "subscription_infrastructure_admin_audit_log" (deleted_at) WHERE deleted_at IS NULL;')
    this.addSql('CREATE INDEX IF NOT EXISTS "IDX_subscription_infra_audit_infra_id" ON "subscription_infrastructure_admin_audit_log" ("infrastructure_id") WHERE deleted_at IS NULL;')
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "subscription_infrastructure_admin_audit_log" cascade;')
    this.addSql('drop table if exists "subscription_infrastructure_provision_attempt" cascade;')

    this.addSql('alter table if exists "subscription_infrastructure" drop constraint if exists "subscription_infrastructure_status_check";')
    this.addSql(`alter table if exists "subscription_infrastructure" add constraint "subscription_infrastructure_status_check" check ("status" in ('pending', 'provisioning', 'active', 'deleting', 'deleted', 'failed'));`)

    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "cancelled_by";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "cancelled_at";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "failure_diagnostics";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "last_provisioning_finished_at";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "last_provisioning_started_at";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "provisioning_retry_count";')
  }
}
