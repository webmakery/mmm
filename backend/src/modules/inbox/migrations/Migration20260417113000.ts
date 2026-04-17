import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417113000 extends Migration {
  async up(): Promise<void> {
    this.addSql('drop index if exists "message_external_message_id_unique";')

    this.addSql(`
      update "message" as m
      set "external_message_id" = concat(
        coalesce((m.raw_payload->'chat'->>'id'), c.external_thread_id),
        ':',
        m.external_message_id
      )
      from "conversation" as c
      where
        m.conversation_id = c.id
        and m.deleted_at is null
        and m.channel = 'telegram'
        and m.external_message_id is not null
        and position(':' in m.external_message_id) = 0
        and coalesce((m.raw_payload->'chat'->>'id'), c.external_thread_id) is not null;
    `)

    this.addSql(`
      create unique index if not exists "message_channel_external_message_id_unique"
      on "message" ("channel", "external_message_id")
      where deleted_at is null and external_message_id is not null;
    `)
  }

  async down(): Promise<void> {
    this.addSql('drop index if exists "message_channel_external_message_id_unique";')
    this.addSql('create unique index if not exists "message_external_message_id_unique" on "message" ("external_message_id") where deleted_at is null and external_message_id is not null;')
  }
}
