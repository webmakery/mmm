import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260419110000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "blog_post" add column if not exists "image_alt" text null;')
    this.addSql('alter table if exists "blog_post" add column if not exists "canonical_url" text null;')
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "blog_post" drop column if exists "canonical_url";')
    this.addSql('alter table if exists "blog_post" drop column if exists "image_alt";')
  }
}
