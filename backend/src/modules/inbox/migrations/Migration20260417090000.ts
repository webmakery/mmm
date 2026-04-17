import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417090000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "channel_account" drop constraint if exists "channel_account_provider_check";')
    this.addSql(
      "alter table if exists \"channel_account\" add constraint \"channel_account_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram', 'telegram'));"
    )

    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_provider_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram', 'telegram'));"
    )
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram', 'telegram'));"
    )

    this.addSql('alter table if exists "message" drop constraint if exists "message_provider_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram', 'telegram'));"
    )
    this.addSql('alter table if exists "message" drop constraint if exists "message_channel_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram', 'telegram'));"
    )
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "message" drop constraint if exists "message_channel_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('alter table if exists "message" drop constraint if exists "message_provider_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )

    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_channel_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_channel_check\" check (\"channel\" in ('whatsapp', 'messenger', 'instagram'));"
    )
    this.addSql('alter table if exists "conversation" drop constraint if exists "conversation_provider_check";')
    this.addSql(
      "alter table if exists \"conversation\" add constraint \"conversation_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )

    this.addSql('alter table if exists "channel_account" drop constraint if exists "channel_account_provider_check";')
    this.addSql(
      "alter table if exists \"channel_account\" add constraint \"channel_account_provider_check\" check (\"provider\" in ('whatsapp', 'messenger', 'instagram'));"
    )
  }
}
