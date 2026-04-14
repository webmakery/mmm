import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20250813000000 extends Migration {
  override async up(): Promise<void> {
    // Intentionally left empty: this migration timestamp is retained for ordering.
  }

  override async down(): Promise<void> {
    // Intentionally left empty.
  }
}
