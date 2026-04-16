import { Migration } from "@mikro-orm/migrations"

export class Migration20260416223000 extends Migration {
  async up(): Promise<void> {
    this.addSql('alter table if exists "message" drop constraint if exists "message_type_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_type_check\" check (\"message_type\" in ('text', 'status', 'unsupported', 'private_note'));"
    )
  }

  async down(): Promise<void> {
    this.addSql('alter table if exists "message" drop constraint if exists "message_type_check";')
    this.addSql(
      "alter table if exists \"message\" add constraint \"message_type_check\" check (\"message_type\" in ('text', 'status', 'unsupported'));"
    )
  }
}
