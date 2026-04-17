import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417195500 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "booking_service" add column if not exists "raw_price" jsonb null;')
    this.addSql(`
      update "booking_service"
      set "raw_price" = jsonb_build_object('value', "price"::text, 'precision', 20)
      where "price" is not null and "raw_price" is null;
    `)
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "booking_service" drop column if exists "raw_price";')
  }
}
