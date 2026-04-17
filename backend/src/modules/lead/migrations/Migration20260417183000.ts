import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417183000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`alter table if exists "lead" add column if not exists "raw_value_estimate" jsonb null;`)
    this.addSql(`
      update "lead"
      set "raw_value_estimate" = jsonb_build_object('value', "value_estimate"::text, 'precision', 20)
      where "value_estimate" is not null and "raw_value_estimate" is null;
    `)
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "lead" drop column if exists "raw_value_estimate";')
  }
}
