import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260418200000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "lead" add column if not exists "website" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "google_maps_uri" text null;')

    this.addSql('alter table if exists "lead" add column if not exists "source_detail" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "category" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "lead_score" integer null;')
    this.addSql('alter table if exists "lead" add column if not exists "lead_score_notes" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "pain_points" jsonb null;')
    this.addSql(
      `alter table if exists "lead" add column if not exists "follow_up_status" text check ("follow_up_status" in ('not_scheduled','scheduled','pending_approval','approved','sent','failed')) not null default 'not_scheduled';`
    )
    this.addSql('alter table if exists "lead" add column if not exists "follow_up_event_id" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "outreach_message_draft" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "outreach_approved_at" timestamptz null;')
    this.addSql('alter table if exists "lead" add column if not exists "outreach_sent_at" timestamptz null;')

    this.addSql('create index if not exists "IDX_LEAD_SCORE" on "lead" (lead_score) where deleted_at is null;')
    this.addSql(
      'create index if not exists "IDX_LEAD_FOLLOW_UP_STATUS" on "lead" (follow_up_status) where deleted_at is null;'
    )
  }

  async down(): Promise<void> {
    // Intentionally non-destructive: this migration reconciles historical drift with
    // idempotent additions, so rollback must not remove columns/indexes that may be
    // required by earlier migrations or already-present schemas.
  }
}
