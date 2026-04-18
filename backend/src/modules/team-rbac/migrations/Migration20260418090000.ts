import { Migration } from "@mikro-orm/migrations"

export class Migration20260418090000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      create table if not exists "team_role" (
        "id" text not null,
        "key" text not null,
        "name" text not null,
        "description" text null,
        "permissions" jsonb not null default '[]',
        "is_system" boolean not null default false,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "team_role_pkey" primary key ("id")
      );
    `)

    this.addSql(`create unique index if not exists "IDX_team_role_key_unique" on "team_role" ("key") where deleted_at is null;`)

    this.addSql(`
      create table if not exists "team_user_role" (
        "id" text not null,
        "user_id" text not null,
        "role_id" text not null,
        "created_at" timestamptz not null default now(),
        "updated_at" timestamptz not null default now(),
        "deleted_at" timestamptz null,
        constraint "team_user_role_pkey" primary key ("id"),
        constraint "team_user_role_role_id_foreign" foreign key ("role_id") references "team_role" ("id") on update cascade
      );
    `)

    this.addSql(`create index if not exists "IDX_TEAM_USER_ROLE_USER_ID" on "team_user_role" ("user_id") where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_TEAM_USER_ROLE_ROLE_ID" on "team_user_role" ("role_id") where deleted_at is null;`)
    this.addSql(`create unique index if not exists "IDX_TEAM_USER_ROLE_USER_ROLE_UNIQUE" on "team_user_role" ("user_id", "role_id") where deleted_at is null;`)
  }

  override async down(): Promise<void> {
    this.addSql('drop table if exists "team_user_role" cascade;')
    this.addSql('drop table if exists "team_role" cascade;')
  }
}
