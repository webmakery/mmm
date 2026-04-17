import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260417195000 extends Migration {
  async up(): Promise<void> {
    this.addSql(`create table if not exists "booking_service" (
      "id" text not null,
      "name" text not null,
      "description" text null,
      "duration_minutes" integer not null default 30,
      "availability_start_time" text not null default '09:00',
      "availability_end_time" text not null default '17:00',
      "timezone" text not null default 'UTC',
      "price" numeric null,
      "is_active" boolean not null default true,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "booking_service_pkey" primary key ("id")
    );`)

    this.addSql(`create index if not exists "IDX_BOOKING_SERVICE_NAME" on "booking_service" (name) where deleted_at is null;`)

    this.addSql(`create table if not exists "booking_rule" (
      "id" text not null,
      "minimum_notice_minutes" integer not null default 60,
      "maximum_days_in_advance" integer not null default 60,
      "cancellation_window_hours" integer not null default 24,
      "reschedule_window_hours" integer not null default 12,
      "same_day_booking_enabled" boolean not null default false,
      "buffer_minutes" integer not null default 15,
      "blackout_dates" jsonb null,
      "timezone" text not null default 'UTC',
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "booking_rule_pkey" primary key ("id")
    );`)

    this.addSql(`create table if not exists "booking" (
      "id" text not null,
      "reference" text not null,
      "service_id" text not null,
      "customer_full_name" text not null,
      "customer_email" text not null,
      "customer_phone" text null,
      "notes" text null,
      "status" text check ("status" in ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')) not null default 'pending',
      "scheduled_start_at" timestamptz not null,
      "scheduled_end_at" timestamptz not null,
      "timezone" text not null default 'UTC',
      "cancelled_at" timestamptz null,
      "metadata" jsonb null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "booking_pkey" primary key ("id"),
      constraint "booking_service_id_foreign" foreign key ("service_id") references "booking_service" ("id") on update cascade on delete restrict
    );`)

    this.addSql(`create index if not exists "IDX_BOOKING_REFERENCE" on "booking" (reference) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_BOOKING_CUSTOMER_NAME" on "booking" (customer_full_name) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_BOOKING_CUSTOMER_EMAIL" on "booking" (customer_email) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_BOOKING_STATUS" on "booking" (status) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_BOOKING_START" on "booking" (scheduled_start_at) where deleted_at is null;`)
    this.addSql(`create index if not exists "IDX_BOOKING_END" on "booking" (scheduled_end_at) where deleted_at is null;`)

    this.addSql(`create table if not exists "booking_notification" (
      "id" text not null,
      "booking_id" text not null,
      "type" text check ("type" in ('confirmation', 'cancellation', 'reminder', 'update')) not null,
      "channel" text not null default 'feed',
      "payload" jsonb null,
      "sent_at" timestamptz null,
      "created_at" timestamptz not null default now(),
      "updated_at" timestamptz not null default now(),
      "deleted_at" timestamptz null,
      constraint "booking_notification_pkey" primary key ("id"),
      constraint "booking_notification_booking_id_foreign" foreign key ("booking_id") references "booking" ("id") on update cascade on delete cascade
    );`)

    this.addSql(`create index if not exists "IDX_BOOKING_NOTIFICATION_TYPE" on "booking_notification" (type) where deleted_at is null;`)
  }

  async down(): Promise<void> {
    this.addSql('drop table if exists "booking_notification" cascade;')
    this.addSql('drop table if exists "booking" cascade;')
    this.addSql('drop table if exists "booking_rule" cascade;')
    this.addSql('drop table if exists "booking_service" cascade;')
  }
}
