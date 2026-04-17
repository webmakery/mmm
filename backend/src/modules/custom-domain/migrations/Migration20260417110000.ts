import { Migration } from '@mikro-orm/migrations'

export class Migration20260417110000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "custom_domain" (
      "id" text not null,
      "store_id" text not null,
      "domain" text not null,
      "target_host" text not null,
      "expected_value" text not null,
      "verification_type" text check ("verification_type" in ('cname', 'a_record')) not null default 'cname',
      "status" text check ("status" in ('pending_dns', 'active', 'failed', 'removed')) not null default 'pending_dns',
      "last_checked_at" timestamptz null,
      "activated_at" timestamptz null,
      "failure_reason" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "custom_domain_pkey" primary key ("id")
    );`)

    this.addSql('create unique index if not exists "IDX_custom_domain_domain_unique" on "custom_domain" (lower(domain));')
    this.addSql('create index if not exists "IDX_custom_domain_store_id" on "custom_domain" ("store_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_custom_domain_status" on "custom_domain" ("status") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_custom_domain_deleted_at" on "custom_domain" (deleted_at) where deleted_at is null;')
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "custom_domain" cascade;')
  }
}
