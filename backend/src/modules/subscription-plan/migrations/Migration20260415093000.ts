import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260415093000 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "subscription_plan" ("id" text not null, "name" text not null, "stripe_product_id" text not null, "stripe_price_id" text not null, "interval" text check ("interval" in ('monthly', 'yearly')) not null, "active" boolean not null default true, "metadata" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "subscription_plan_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_subscription_plan_deleted_at" ON "subscription_plan" (deleted_at) WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_plan_stripe_price_id" ON "subscription_plan" ("stripe_price_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_subscription_plan_stripe_product_id_name" ON "subscription_plan" ("stripe_product_id", "name") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "subscription_plan" cascade;`);
  }

}
