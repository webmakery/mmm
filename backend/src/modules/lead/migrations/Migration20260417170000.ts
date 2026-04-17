import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417170000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "lead_stage" (
      "id" text not null,
      "name" text not null,
      "slug" text not null,
      "sort_order" integer not null default 0,
      "color" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "lead_stage_pkey" primary key ("id"),
      constraint "lead_stage_slug_unique" unique ("slug")
    );`)

    this.addSql(`create table if not exists "lead" (
      "id" text not null,
      "first_name" text not null,
      "last_name" text null,
      "email" text null,
      "phone" text null,
      "company" text null,
      "source" text null,
      "status" text check ("status" in ('new', 'contacted', 'qualified', 'won', 'lost')) not null default 'new',
      "stage_id" text null,
      "owner_user_id" text null,
      "value_estimate" numeric null,
      "notes_summary" text null,
      "next_follow_up_at" timestamptz null,
      "customer_id" text null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "lead_pkey" primary key ("id"),
      constraint "lead_stage_id_foreign" foreign key ("stage_id") references "lead_stage" ("id") on update cascade on delete set null
    );`)

    this.addSql(`create index if not exists "IDX_LEAD_EMAIL" on "lead" (email) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_COMPANY" on "lead" (company) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_SOURCE" on "lead" (source) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_STATUS" on "lead" (status) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_OWNER" on "lead" (owner_user_id) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_NEXT_FOLLOW_UP" on "lead" (next_follow_up_at) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_CUSTOMER_ID" on "lead" (customer_id) where deleted_at is null;`)

    this.addSql(`create table if not exists "lead_activity" (
      "id" text not null,
      "type" text check ("type" in ('note', 'call', 'email', 'meeting', 'task', 'status_change')) not null,
      "content" text not null,
      "created_by" text null,
      "due_at" timestamptz null,
      "completed_at" timestamptz null,
      "lead_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "lead_activity_pkey" primary key ("id"),
      constraint "lead_activity_lead_id_foreign" foreign key ("lead_id") references "lead" ("id") on update cascade on delete cascade
    );`)

    this.addSql(`create index if not exists "IDX_LEAD_ACTIVITY_TYPE" on "lead_activity" (type) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_ACTIVITY_DUE_AT" on "lead_activity" (due_at) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_LEAD_ACTIVITY_LEAD_ID" on "lead_activity" (lead_id) where deleted_at is null;`)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "lead_activity" cascade;')
    this.addSql('drop table if exists "lead" cascade;')
    this.addSql('drop table if exists "lead_stage" cascade;')
  }
}
