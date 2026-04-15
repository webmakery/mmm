import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260415090000 extends Migration {

  async up(): Promise<void> {
    this.addSql('alter table if exists "subscription" add column if not exists "stripe_customer_id" text null;');
    this.addSql('alter table if exists "subscription" add column if not exists "stripe_subscription_id" text null;');
    this.addSql('alter table if exists "subscription" add column if not exists "stripe_price_id" text null;');
    this.addSql('alter table if exists "subscription" add column if not exists "stripe_product_id" text null;');
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "subscription" drop column if exists "stripe_product_id";');
    this.addSql('alter table if exists "subscription" drop column if exists "stripe_price_id";');
    this.addSql('alter table if exists "subscription" drop column if exists "stripe_subscription_id";');
    this.addSql('alter table if exists "subscription" drop column if exists "stripe_customer_id";');
  }

}
