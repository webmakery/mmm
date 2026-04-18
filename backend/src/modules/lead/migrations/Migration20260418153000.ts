import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260418153000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "lead" add column if not exists "website" text null;')
    this.addSql('alter table if exists "lead" add column if not exists "google_maps_uri" text null;')
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "lead" drop column if exists "website";')
    this.addSql('alter table if exists "lead" drop column if exists "google_maps_uri";')
  }
}
