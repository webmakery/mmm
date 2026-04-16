import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260416190000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "conversation" add column if not exists "tenant_id" text null;')
    this.addSql("alter table if exists \"conversation\" add column if not exists \"channel\" text not null default 'whatsapp';")
    this.addSql('alter table if exists "conversation" add column if not exists "customer_phone" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "customer_name" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "last_message_preview" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "unread_count" integer not null default 0;')
    this.addSql('update "conversation" set "customer_phone" = coalesce("customer_phone", "customer_identifier") where deleted_at is null;')
    this.addSql('alter table if exists "conversation" alter column "customer_phone" set not null;')
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql("alter table if exists \"conversation\" add constraint \"conversation_channel_check\" check (\"channel\" in ('whatsapp'));")
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_status_check";')
    this.addSql("alter table if exists \"conversation\" add constraint \"conversation_status_check\" check (\"status\" in ('open', 'closed', 'archived'));")
    this.addSql('create index if not exists "IDX_conversation_tenant_id" on "conversation" ("tenant_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_conversation_customer_phone" on "conversation" ("customer_phone") where deleted_at is null;')

    this.addSql('alter table if exists "message" add column if not exists "whatsapp_message_id" text null;')
    this.addSql('alter table if exists "message" add column if not exists "text" text null;')
    this.addSql('update "message" set "text" = coalesce("text", "content") where deleted_at is null;')
    this.addSql('update "message" set "whatsapp_message_id" = coalesce("whatsapp_message_id", "external_message_id") where deleted_at is null;')
    this.addSql('create unique index if not exists "message_whatsapp_message_id_unique" on "message" ("whatsapp_message_id") where deleted_at is null and whatsapp_message_id is not null;')
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "message_whatsapp_message_id_unique";')
    this.addSql('alter table if exists "message" drop column if exists "text";')
    this.addSql('alter table if exists "message" drop column if exists "whatsapp_message_id";')

    this.addSql('drop index if exists "IDX_conversation_customer_phone";')
    this.addSql('drop index if exists "IDX_conversation_tenant_id";')
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_status_check";')
    this.addSql("alter table if exists \"conversation\" add constraint \"conversation_status_check\" check (\"status\" in ('open', 'archived'));")
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql('alter table if exists "conversation" drop column if exists "unread_count";')
    this.addSql('alter table if exists "conversation" drop column if exists "last_message_preview";')
    this.addSql('alter table if exists "conversation" drop column if exists "customer_name";')
    this.addSql('alter table if exists "conversation" drop column if exists "customer_phone";')
    this.addSql('alter table if exists "conversation" drop column if exists "channel";')
    this.addSql('alter table if exists "conversation" drop column if exists "tenant_id";')
  }
}
