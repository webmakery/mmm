import { Migration } from "@mikro-orm/migrations"

export class Migration20260420113000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`
      do $$
      declare
        constraint_name text;
      begin
        select con.conname
          into constraint_name
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        where rel.relname = 'email_campaign'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) like '%status%';

        if constraint_name is not null then
          execute format('alter table "email_campaign" drop constraint %I', constraint_name);
        end if;
      end
      $$;
    `)

    this.addSql(`
      alter table "email_campaign"
      add constraint "email_campaign_status_check"
      check ("status" in ('draft', 'scheduled', 'automated', 'processing', 'sent', 'failed'));
    `)
  }

  override async down(): Promise<void> {
    this.addSql('alter table "email_campaign" drop constraint if exists "email_campaign_status_check";')

    this.addSql(`
      alter table "email_campaign"
      add constraint "email_campaign_status_check"
      check ("status" in ('draft', 'scheduled', 'processing', 'sent', 'failed'));
    `)
  }
}
