# Email Marketing System for Medusa

This document describes a modular email marketing implementation for Medusa admin, including schema, architecture, APIs, workflows, provider strategy, and a phased development plan.

## 1) Database schema

### Core entities

- `email_subscriber`
  - `id`, `email` (unique), `first_name`, `last_name`
  - `status`: `active | unsubscribed | bounced`
  - `unsubscribe_token`, `unsubscribed_at`, `bounced_at`
  - `tags`, `source`, `metadata`
- `email_template`
  - `id`, `name`, `description`, `subject`
  - `html_content`, `text_content`, `variables`, `metadata`
- `email_campaign`
  - `id`, `name`, `subject`
  - `sender_name`, `sender_email`
  - `status`: `draft | scheduled | processing | sent | failed`
  - `template_id`, `audience_filter`, `scheduled_at`, `sent_at`, `metadata`
- `email_campaign_log`
  - `id`, `campaign_id`, `subscriber_id`
  - `provider_message_id`, `status`
  - `error_message`, `delivered_at`, `opened_at`, `clicked_at`, `metadata`

## 2) Backend architecture

### Module

- New module: `src/modules/email-marketing`
  - `models/` for subscriber/template/campaign/log
  - `service.ts` for business logic:
    - subscriber create/update/import/list/unsubscribe
    - template preview rendering with variable interpolation
    - campaign draft creation and send queue bootstrap
    - analytics aggregation
  - migration in `migrations/Migration20260420100000.ts`

### API layers

- Admin APIs under `src/api/admin/email-marketing/...`
- Store unsubscribe API under `src/api/store/email-marketing/unsubscribe`
- Request validation wired into `src/api/middlewares.ts`

### Config

- Module registration in `backend/medusa-config.ts`:
  - `resolve: "./src/modules/email-marketing"`

## 3) API endpoints

### Subscribers

- `GET /admin/email-marketing/subscribers`
- `POST /admin/email-marketing/subscribers`
- `POST /admin/email-marketing/subscribers/import`
- `GET /admin/email-marketing/subscribers/:id`
- `POST /admin/email-marketing/subscribers/:id`
- `DELETE /admin/email-marketing/subscribers/:id`

### Templates

- `GET /admin/email-marketing/templates`
- `POST /admin/email-marketing/templates`
- `POST /admin/email-marketing/templates/preview`
- `GET /admin/email-marketing/templates/:id`
- `POST /admin/email-marketing/templates/:id`
- `DELETE /admin/email-marketing/templates/:id`

### Campaigns

- `GET /admin/email-marketing/campaigns`
- `POST /admin/email-marketing/campaigns`
- `GET /admin/email-marketing/campaigns/:id`
- `POST /admin/email-marketing/campaigns/:id`
- `DELETE /admin/email-marketing/campaigns/:id`
- `POST /admin/email-marketing/campaigns/:id/send`
- `GET /admin/email-marketing/campaigns/:id/analytics`

### Public unsubscribe

- `POST /store/email-marketing/unsubscribe`

## 4) Admin UI structure

Routes added in Medusa Admin:

- `/email-subscribers`
- `/email-templates`
- `/email-campaigns`
- `/email-analytics`

These pages follow existing Medusa admin components (`Container`, `Heading`, `Table`, `Text`, `Button`, `Input`, `Select`) for brand-consistent UI.

## 5) Campaign creation + send workflow

1. Admin creates template with subject/body and variables.
2. Admin creates campaign with sender, subject, template, and audience filter.
3. Campaign is saved in `draft` or `scheduled`.
4. Admin sends immediately (or scheduler triggers at `scheduled_at`).
5. Backend transitions campaign to `processing`, expands subscriber target list, inserts `email_campaign_log` entries with `queued` status.
6. Worker sends emails through provider and updates each log to `sent/delivered/failed`.
7. Tracking webhooks update opens/clicks.
8. Analytics endpoint aggregates totals, open rate, and click rate.

## 6) Recommended email provider integration

Recommended order:

1. **Resend** (quick integration, modern API, good DX)
2. **SendGrid** (mature platform, strong deliverability tooling)
3. **Amazon SES** (lowest cost at scale, more setup complexity)

Suggested provider abstraction:

- `EmailProvider` interface:
  - `sendBatch(messages)`
  - `verifyWebhook(payload, signature)`
  - `mapProviderEventToLogUpdate(event)`
- Concrete adapters:
  - `resend-provider.ts`
  - `sendgrid-provider.ts`
  - `ses-provider.ts`

## 7) Sample implementation code map

Implemented sample files:

- Module core
  - `backend/src/modules/email-marketing/index.ts`
  - `backend/src/modules/email-marketing/service.ts`
  - `backend/src/modules/email-marketing/models/*.ts`
  - `backend/src/modules/email-marketing/migrations/Migration20260420100000.ts`
- Admin APIs
  - `backend/src/api/admin/email-marketing/**/route.ts`
- Store unsubscribe API
  - `backend/src/api/store/email-marketing/unsubscribe/route.ts`
- Admin UI pages
  - `backend/src/admin/routes/email-subscribers/page.tsx`
  - `backend/src/admin/routes/email-templates/page.tsx`
  - `backend/src/admin/routes/email-campaigns/page.tsx`
  - `backend/src/admin/routes/email-analytics/page.tsx`

## 8) Step-by-step development plan

### Phase 1 — Data + CRUD

1. Run migration for new email marketing tables.
2. Seed initial templates/statuses.
3. Validate subscriber/template/campaign CRUD in admin APIs.

### Phase 2 — Sending pipeline

1. Add queue worker for `campaign.send` jobs.
2. Implement provider adapter (start with Resend).
3. Batch sending with throttling and retry policy.
4. Write delivery/failure updates into `email_campaign_log`.

### Phase 3 — Tracking + analytics

1. Add webhook endpoints for provider events.
2. Update campaign logs with delivered/open/click status.
3. Build analytics cards/charts in admin route.

### Phase 4 — Hardening

1. Add RBAC checks per endpoint.
2. Add idempotency for send jobs.
3. Add rate limits and import caps.
4. Add automated tests (module service, API, queue integration).

### Phase 5 — Product polish

1. Add template builder helpers and variable picker.
2. Add campaign audience presets/segments.
3. Add CSV import/export and campaign cloning.
4. Add suppression list management and compliance exports.
