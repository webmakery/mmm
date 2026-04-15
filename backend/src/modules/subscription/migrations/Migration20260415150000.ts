import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260415150000 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "subscription" add column if not exists "stripe_status" text null;');
    this.addSql('alter table if exists "subscription" add column if not exists "cancel_at_period_end" boolean not null default false;');
    this.addSql('alter table if exists "subscription" add column if not exists "canceled_at" timestamptz null;');
    this.addSql('alter table if exists "subscription" add column if not exists "current_period_end" timestamptz null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "subscription" drop column if exists "current_period_end";');
    this.addSql('alter table if exists "subscription" drop column if exists "canceled_at";');
    this.addSql('alter table if exists "subscription" drop column if exists "cancel_at_period_end";');
    this.addSql('alter table if exists "subscription" drop column if exists "stripe_status";');
  }

}
