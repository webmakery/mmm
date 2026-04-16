import { Migration } from "@mikro-orm/migrations"

export class Migration20260416110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      'alter table if exists "subscription_infrastructure" add column if not exists "server_ip" text null;'
    )
    this.addSql(
      'alter table if exists "subscription_infrastructure" add column if not exists "server_cpu" numeric null;'
    )
    this.addSql(
      'alter table if exists "subscription_infrastructure" add column if not exists "server_ram_gb" numeric null;'
    )
  }

  override async down(): Promise<void> {
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "server_ram_gb";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "server_cpu";')
    this.addSql('alter table if exists "subscription_infrastructure" drop column if exists "server_ip";')
  }
}
