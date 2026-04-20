import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260420130000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table "journey_session" add column if not exists "referrer_host" text null;')
    this.addSql('alter table "journey_session" add column if not exists "utm_term" text null;')
    this.addSql('alter table "journey_session" add column if not exists "utm_content" text null;')
    this.addSql('alter table "journey_session" add column if not exists "normalized_source" text null;')
    this.addSql('alter table "journey_session" add column if not exists "normalized_medium" text null;')

    this.addSql('alter table "journey_event" add column if not exists "referrer_host" text null;')
    this.addSql('alter table "journey_event" add column if not exists "utm_term" text null;')
    this.addSql('alter table "journey_event" add column if not exists "utm_content" text null;')
    this.addSql('alter table "journey_event" add column if not exists "normalized_source" text null;')
    this.addSql('alter table "journey_event" add column if not exists "normalized_medium" text null;')

    this.addSql('alter table "journey_attribution_touch" add column if not exists "term" text null;')
    this.addSql('alter table "journey_attribution_touch" add column if not exists "content" text null;')
    this.addSql('alter table "journey_attribution_touch" add column if not exists "referrer_host" text null;')
  }

  async down(): Promise<void> {
    this.addSql('alter table "journey_attribution_touch" drop column if exists "referrer_host";')
    this.addSql('alter table "journey_attribution_touch" drop column if exists "content";')
    this.addSql('alter table "journey_attribution_touch" drop column if exists "term";')

    this.addSql('alter table "journey_event" drop column if exists "normalized_medium";')
    this.addSql('alter table "journey_event" drop column if exists "normalized_source";')
    this.addSql('alter table "journey_event" drop column if exists "utm_content";')
    this.addSql('alter table "journey_event" drop column if exists "utm_term";')
    this.addSql('alter table "journey_event" drop column if exists "referrer_host";')

    this.addSql('alter table "journey_session" drop column if exists "normalized_medium";')
    this.addSql('alter table "journey_session" drop column if exists "normalized_source";')
    this.addSql('alter table "journey_session" drop column if exists "utm_content";')
    this.addSql('alter table "journey_session" drop column if exists "utm_term";')
    this.addSql('alter table "journey_session" drop column if exists "referrer_host";')
  }
}
