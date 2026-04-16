import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260416210000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "channel_account" drop constraint if exists "channel_account_provider_check";')
    this.addSql(
      "alter table if exists \"channel_account\" add constraint \"channel_account_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )

    this.addSql('alter table if exists "conversation" add column if not exists "external_user_id" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "customer_handle" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "page_id" text null;')
    this.addSql('alter table if exists "conversation" add column if not exists "instagram_account_id" text null;')
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_provider_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('create index if not exists "IDX_conversation_external_user_id" on "conversation" ("external_user_id") where deleted_at is null;')

    this.addSql("alter table if exists \"message\" add column if not exists \"channel\" text not null default 'whatsapp';")
    this.addSql('update "message" set "channel" = "provider" where deleted_at is null;')
    this.addSql('alter table if exists "message" drop constraint if exists "message_provider_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('alter table if exists "message" drop constraint if exists "message_channel_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('create index if not exists "IDX_message_external_message_id" on "message" ("external_message_id") where deleted_at is null and external_message_id is not null;')
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_message_external_message_id";')
    this.addSql('alter table if exists "message" drop constraint if exists "message_channel_check";')
    this.addSql('alter table if exists "message" drop constraint if exists "message_provider_check";')
    this.addSql("alter table if exists \"message\" add constraint \"message_provider_check\" check (\"provider\" in ('whatsapp'));")
    this.addSql('alter table if exists "message" drop column if exists "channel";')

    this.addSql('drop index if exists "IDX_conversation_external_user_id";')
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql("alter table if exists \"conversation\" add constraint \"conversation_channel_check\" check (\"channel\" in ('whatsapp'));")
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_provider_check";')
    this.addSql("alter table if exists \"conversation\" add constraint \"conversation_provider_check\" check (\"provider\" in ('whatsapp'));")
    this.addSql('alter table if exists "conversation" drop column if exists "instagram_account_id";')
    this.addSql('alter table if exists "conversation" drop column if exists "page_id";')
    this.addSql('alter table if exists "conversation" drop column if exists "customer_handle";')
    this.addSql('alter table if exists "conversation" drop column if exists "external_user_id";')

    this.addSql('alter table if exists "channel_account" drop constraint if exists "channel_account_provider_check";')
    this.addSql("alter table if exists \"channel_account\" add constraint \"channel_account_provider_check\" check (\"provider\" in ('whatsapp'));")
  }
}
