import { Migration } from "@mikro-orm/migrations"

export class Migration20260421100000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      with ranked_logs as (
        select
          id,
          row_number() over (
            partition by campaign_id, subscriber_id
            order by updated_at desc nulls last, created_at desc nulls last, id desc
          ) as duplicate_rank
        from email_campaign_log
        where deleted_at is null
      )
      update email_campaign_log as log
      set deleted_at = now(),
          updated_at = now()
      from ranked_logs
      where log.id = ranked_logs.id
        and ranked_logs.duplicate_rank > 1;
    `)

    this.addSql(
      'create unique index if not exists "IDX_email_campaign_log_campaign_subscriber_unique" on "email_campaign_log" ("campaign_id", "subscriber_id") where deleted_at is null;'
    )
    this.addSql(
      'create index if not exists "IDX_email_campaign_scheduled_at" on "email_campaign" ("scheduled_at") where deleted_at is null;'
    )
  }

  override async down(): Promise<void> {
    this.addSql('drop index if exists "IDX_email_campaign_log_campaign_subscriber_unique";')
    this.addSql('drop index if exists "IDX_email_campaign_scheduled_at";')
  }
}
