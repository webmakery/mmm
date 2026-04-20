import { Migration } from "@mikro-orm/migrations"

export class Migration20260420100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "email_subscriber" (
      "id" text not null,
      "email" text not null,
      "first_name" text null,
      "last_name" text null,
      "status" text check ("status" in ('active', 'unsubscribed', 'bounced')) not null default 'active',
      "tags" jsonb null,
      "source" text null,
      "unsubscribe_token" text null,
      "unsubscribed_at" timestamptz null,
      "bounced_at" timestamptz null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "email_subscriber_pkey" primary key ("id")
    );`)

    this.addSql('create unique index if not exists "email_subscriber_email_unique" on "email_subscriber" ("email") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_EMAIL_SUBSCRIBER_UNSUB_TOKEN" on "email_subscriber" ("unsubscribe_token") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_email_subscriber_deleted_at" on "email_subscriber" ("deleted_at") where deleted_at is null;')

    this.addSql(`create table if not exists "email_template" (
      "id" text not null,
      "name" text not null,
      "description" text null,
      "subject" text not null,
      "html_content" text not null,
      "text_content" text null,
      "variables" jsonb null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "email_template_pkey" primary key ("id")
    );`)
    this.addSql('create index if not exists "IDX_email_template_deleted_at" on "email_template" ("deleted_at") where deleted_at is null;')

    this.addSql(`create table if not exists "email_campaign" (
      "id" text not null,
      "name" text not null,
      "subject" text not null,
      "sender_name" text not null,
      "sender_email" text not null,
      "scheduled_at" timestamptz null,
      "sent_at" timestamptz null,
      "status" text check ("status" in ('draft', 'scheduled', 'processing', 'sent', 'failed')) not null default 'draft',
      "audience_filter" jsonb null,
      "template_id" text not null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "email_campaign_pkey" primary key ("id")
    );`)
    this.addSql('create index if not exists "IDX_email_campaign_deleted_at" on "email_campaign" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_email_campaign_status" on "email_campaign" ("status") where deleted_at is null;')
    this.addSql('alter table if exists "email_campaign" add constraint "email_campaign_template_id_foreign" foreign key ("template_id") references "email_template" ("id") on update cascade on delete restrict;')

    this.addSql(`create table if not exists "email_campaign_log" (
      "id" text not null,
      "provider_message_id" text null,
      "status" text check ("status" in ('queued', 'sent', 'delivered', 'opened', 'clicked', 'failed')) not null default 'queued',
      "error_message" text null,
      "delivered_at" timestamptz null,
      "opened_at" timestamptz null,
      "clicked_at" timestamptz null,
      "campaign_id" text not null,
      "subscriber_id" text not null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "email_campaign_log_pkey" primary key ("id")
    );`)

    this.addSql('create index if not exists "IDX_email_campaign_log_deleted_at" on "email_campaign_log" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_email_campaign_log_campaign_id" on "email_campaign_log" ("campaign_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_email_campaign_log_subscriber_id" on "email_campaign_log" ("subscriber_id") where deleted_at is null;')
    this.addSql('alter table if exists "email_campaign_log" add constraint "email_campaign_log_campaign_id_foreign" foreign key ("campaign_id") references "email_campaign" ("id") on update cascade on delete cascade;')
    this.addSql('alter table if exists "email_campaign_log" add constraint "email_campaign_log_subscriber_id_foreign" foreign key ("subscriber_id") references "email_subscriber" ("id") on update cascade on delete cascade;')
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "email_campaign_log" cascade;')
    this.addSql('drop table if exists "email_campaign" cascade;')
    this.addSql('drop table if exists "email_template" cascade;')
    this.addSql('drop table if exists "email_subscriber" cascade;')
  }
}
