import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260419090000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "blog_post" (
      "id" text not null,
      "title" text not null,
      "slug" text not null,
      "excerpt" text null,
      "content" jsonb null,
      "featured_image" text null,
      "author_name" text null,
      "seo_title" text null,
      "seo_description" text null,
      "publish_date" timestamptz null,
      "status" text not null default 'draft',
      "tags" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "blog_post_pkey" primary key ("id"),
      constraint "blog_post_status_check" check ("status" in ('draft', 'published'))
    );`)

    this.addSql('create unique index if not exists "blog_post_slug_unique" on "blog_post" ("slug") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_post_deleted_at" on "blog_post" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_post_publish_date" on "blog_post" ("publish_date") where deleted_at is null;')

    this.addSql(`create table if not exists "blog_category" (
      "id" text not null,
      "name" text not null,
      "slug" text not null,
      "description" text null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "blog_category_pkey" primary key ("id")
    );`)

    this.addSql('create unique index if not exists "blog_category_slug_unique" on "blog_category" ("slug") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_category_deleted_at" on "blog_category" ("deleted_at") where deleted_at is null;')

    this.addSql(`create table if not exists "blog_post_category" (
      "id" text not null,
      "post_id" text not null,
      "category_id" text not null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "blog_post_category_pkey" primary key ("id")
    );`)

    this.addSql('create unique index if not exists "blog_post_category_post_id_category_id_unique" on "blog_post_category" ("post_id", "category_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_post_category_deleted_at" on "blog_post_category" ("deleted_at") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_post_category_post_id" on "blog_post_category" ("post_id") where deleted_at is null;')
    this.addSql('create index if not exists "IDX_blog_post_category_category_id" on "blog_post_category" ("category_id") where deleted_at is null;')

    this.addSql('alter table if exists "blog_post_category" add constraint "blog_post_category_post_id_foreign" foreign key ("post_id") references "blog_post" ("id") on update cascade on delete cascade;')
    this.addSql('alter table if exists "blog_post_category" add constraint "blog_post_category_category_id_foreign" foreign key ("category_id") references "blog_category" ("id") on update cascade on delete cascade;')
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "blog_post_category" cascade;')
    this.addSql('drop table if exists "blog_category" cascade;')
    this.addSql('drop table if exists "blog_post" cascade;')
  }
}
