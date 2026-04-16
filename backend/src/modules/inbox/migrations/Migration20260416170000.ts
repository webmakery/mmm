import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260416170000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "channel_account" (
      "id" text not null,
      "provider" text not null default 'whatsapp',
      "external_account_id" text not null,
      "display_name" text null,
      "metadata" jsonb null,
      "raw_payload" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "channel_account_pkey" primary key ("id"),
      constraint "channel_account_provider_check" check ("provider" in ('whatsapp'))
    );`)

    this.addSql('create unique index if not exists "channel_account_external_account_id_unique" on "channel_account" ("external_account_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_channel_account_deleted_at" on "channel_account" ("deleted_at") where deleted_at is null;')

    this.addSql(`create table if not exists "conversation" (
      "id" text not null,
      "provider" text not null default 'whatsapp',
      "external_thread_id" text null,
      "customer_identifier" text not null,
      "subject" text null,
      "status" text not null default 'open',
      "last_message_at" timestamptz null,
      "metadata" jsonb null,
      "channel_account_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "conversation_pkey" primary key ("id"),
      constraint "conversation_provider_check" check ("provider" in ('whatsapp')),
      constraint "conversation_status_check" check ("status" in ('open', 'archived'))
    );`)

    this.addSql('create index if not exists "IDX_conversation_deleted_at" on "conversation" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_conversation_customer_identifier" on "conversation" ("customer_identifier") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_conversation_channel_account_id" on "conversation" ("channel_account_id") where deleted_at is null;')
    this.addSql('alter table if exists "conversation" add constraint "conversation_channel_account_id_foreign" foreign key ("channel_account_id") references "channel_account" ("id") on update cascade;')

    this.addSql(`create table if not exists "participant" (
      "id" text not null,
      "role" text not null default 'customer',
      "display_name" text null,
      "external_id" text not null,
      "metadata" jsonb null,
      "conversation_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "participant_pkey" primary key ("id"),
      constraint "participant_role_check" check ("role" in ('customer', 'agent', 'system'))
    );`)

    this.addSql('create index if not exists "IDX_participant_deleted_at" on "participant" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_participant_conversation_id" on "participant" ("conversation_id") where deleted_at is null;')
    this.addSql('alter table if exists "participant" add constraint "participant_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;')

    this.addSql(`create table if not exists "message" (
      "id" text not null,
      "provider" text not null default 'whatsapp',
      "external_message_id" text null,
      "external_event_id" text null,
      "direction" text not null,
      "message_type" text not null default 'text',
      "status" text not null default 'pending',
      "provider_status" text null,
      "content" text null,
      "error_message" text null,
      "sent_at" timestamptz null,
      "received_at" timestamptz null,
      "metadata" jsonb null,
      "raw_payload" jsonb null,
      "conversation_id" text not null,
      "participant_id" text null,
      "channel_account_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "message_pkey" primary key ("id"),
      constraint "message_provider_check" check ("provider" in ('whatsapp')),
      constraint "message_direction_check" check ("direction" in ('inbound', 'outbound', 'system')),
      constraint "message_type_check" check ("message_type" in ('text', 'status', 'unsupported')),
      constraint "message_status_check" check ("status" in ('pending', 'sent', 'delivered', 'read', 'failed', 'received'))
    );`)

    this.addSql('create unique index if not exists "message_external_message_id_unique" on "message" ("external_message_id") where deleted_at is null and external_message_id is not null;')
    this.addSql('create unique index if not exists "message_external_event_id_unique" on "message" ("external_event_id") where deleted_at is null and external_event_id is not null;')
    this.addSql('create index if not exists "IDX_message_deleted_at" on "message" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_message_conversation_id" on "message" ("conversation_id") where deleted_at is null;')
    this.addSql('alter table if exists "message" add constraint "message_conversation_id_foreign" foreign key ("conversation_id") references "conversation" ("id") on update cascade;')
    this.addSql('alter table if exists "message" add constraint "message_participant_id_foreign" foreign key ("participant_id") references "participant" ("id") on update cascade on delete set null;')
    this.addSql('alter table if exists "message" add constraint "message_channel_account_id_foreign" foreign key ("channel_account_id") references "channel_account" ("id") on update cascade;')

    this.addSql(`create table if not exists "message_attachment" (
      "id" text not null,
      "provider_attachment_id" text null,
      "mime_type" text null,
      "filename" text null,
      "url" text null,
      "metadata" jsonb null,
      "raw_payload" jsonb null,
      "message_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "message_attachment_pkey" primary key ("id")
    );`)

    this.addSql('create index if not exists "IDX_message_attachment_deleted_at" on "message_attachment" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_message_attachment_message_id" on "message_attachment" ("message_id") where deleted_at is null;')
    this.addSql('alter table if exists "message_attachment" add constraint "message_attachment_message_id_foreign" foreign key ("message_id") references "message" ("id") on update cascade;')
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "message_attachment" cascade;')
    this.addSql('drop table if exists "message" cascade;')
    this.addSql('drop table if exists "participant" cascade;')
    this.addSql('drop table if exists "conversation" cascade;')
    this.addSql('drop table if exists "channel_account" cascade;')
  }
}
