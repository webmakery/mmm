import { Migration } from "@mikro-orm/migrations"

export class Migration20260415110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscription_infrastructure" ("id" text not null, "order_id" text not null, "customer_id" text not null, "stripe_customer_id" text not null, "stripe_subscription_id" text not null, "stripe_invoice_id" text null, "hetzner_server_id" text null, "hetzner_server_name" text not null, "hetzner_region" text not null, "hetzner_server_type" text not null, "hetzner_image" text not null, "status" text check ("status" in ('pending', 'provisioning', 'active', 'deleting', 'deleted', 'failed')) not null default 'pending', "last_error" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_infrastructure_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_infrastructure_deleted_at" ON "subscription_infrastructure" (deleted_at) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_infra_order_subscription" ON "subscription_infrastructure" ("order_id", "stripe_subscription_id") WHERE deleted_at IS NULL;`)

    this.addSql(`create table if not exists "stripe_webhook_event" ("id" text not null, "event_id" text not null, "event_type" text not null, "processed_at" timestamptz not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "stripe_webhook_event_pkey" primary key ("id"));`)
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_stripe_webhook_event_deleted_at" ON "stripe_webhook_event" (deleted_at) WHERE deleted_at IS NULL;`)
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_stripe_webhook_event_event_id" ON "stripe_webhook_event" ("event_id") WHERE deleted_at IS NULL;`)
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "stripe_webhook_event" cascade;`)
    this.addSql(`drop table if exists "subscription_infrastructure" cascade;`)
  }
}
