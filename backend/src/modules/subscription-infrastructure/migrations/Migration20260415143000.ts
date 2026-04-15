import { Migration } from "@mikro-orm/migrations"

export class Migration20260415143000 extends Migration {
  override async up(): Promise<void> {
    this.addSql('alter table if exists "subscription_infrastructure" alter column "order_id" drop not null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "checkout_session_id" text null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "subscription_plan_id" text null;')
    this.addSql('alter table if exists "subscription_infrastructure" add column if not exists "stripe_price_id" text null;')
    this.addSql('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_infra_subscription_id" ON "subscription_infrastructure" ("stripe_subscription_id") WHERE deleted_at IS NULL;')
  }

  override async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_subscription_infra_subscription_id";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "stripe_price_id";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "subscription_plan_id";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "checkout_session_id";')
  }
}
