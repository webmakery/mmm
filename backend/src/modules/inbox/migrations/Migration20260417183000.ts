import { Migration } from "@mikro-orm/migrations"

export class Migration20260417183000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table if exists "conversation" add column if not exists "customer_email" text null;')
    this.addSql('create index if not exists "IDX_conversation_customer_email" on "conversation" ("customer_email") where deleted_at is null;')
  }

  override async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_conversation_customer_email";')
    this.addSql('alter table if exists "conversation" drop column if exists "customer_email";')
  }
}
