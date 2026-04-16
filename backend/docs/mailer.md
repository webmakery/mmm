# Mailer Setup (Medusa v2 + Notification Module + Nodemailer SMTP)

## Overview

This project sends emails through **Medusa v2's Notification Module**.

At runtime:

1. A domain event is emitted (for example, `customer.created`).
2. A subscriber listens to that event.
3. The subscriber resolves `Modules.NOTIFICATION` from the container.
4. The subscriber calls `createNotifications()` with channel `email`.
5. Medusa routes the notification to the registered provider for the `email` channel.
6. `@perseidesjs/notification-nodemailer` sends the email through your SMTP server.

This follows the Medusa v2 module pattern (no legacy v1 notification plugins).

---

## Why this provider (`@perseidesjs/notification-nodemailer`)

- It integrates directly with Medusa v2 Notification Module providers.
- It uses **Nodemailer**, which is SMTP-based and provider-agnostic.
- You can use any SMTP server (SES SMTP, Mailgun SMTP, Postmark SMTP, Gmail app-password, etc.).
- It keeps email transport configuration centralized in `medusa-config.ts`.

---

## Installation

From `backend/`:

```bash
npm install @perseidesjs/notification-nodemailer nodemailer
```

---

## Environment Variables

Configure SMTP in `.env` (or your deployment secret manager):

- `SMTP_HOST`: SMTP server host (for example `smtp.gmail.com`)
- `SMTP_PORT`: SMTP port (`587` for STARTTLS, `465` for implicit TLS)
- `SMTP_USER`: SMTP auth username
- `SMTP_PASS`: SMTP auth password
- `SMTP_FROM`: default sender email address

> `secure` is derived automatically in config: `true` when `SMTP_PORT=465`, otherwise `false`.

---

## `medusa-config.ts` Setup

1. Register Notification Module (`@medusajs/notification`).
2. Keep local provider for feed notifications.
3. Add Nodemailer provider.
4. Map Nodemailer provider to `channels: ["email"]`.

### Full working example

```ts
import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { getMetaConfigFromEnv } from './src/modules/facebook-capi/config'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const metaConfig = getMetaConfigFromEnv(process.env)

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  modules: [
    {
      resolve: "./src/modules/digital-product",
    },
    {
      resolve: "./src/modules/subscription",
    },
    {
      resolve: "./src/modules/subscription-plan",
    },
    {
      resolve: "./src/modules/subscription-infrastructure",
    },
    {
      resolve: "@medusajs/fulfillment",
      options: {
        providers: [
          {
            resolve: "@medusajs/fulfillment-manual",
            id: "manual",
          },
          {
            resolve: "./src/modules/digital-product-fulfillment",
            id: "digital",
          },
        ],
      },
    },
    {
      resolve: "@medusajs/notification",
      options: {
        providers: [
          {
            resolve: "@medusajs/notification-local",
            id: "local",
            options: {
              name: "Local Notification Provider",
              channels: ["feed"],
            },
          },
          {
            resolve: "@perseidesjs/notification-nodemailer/providers/nodemailer",
            id: "nodemailer",
            options: {
              channels: ["email"],
              from: process.env.SMTP_FROM,
              host: process.env.SMTP_HOST,
              port: Number(process.env.SMTP_PORT || 587),
              secure: Number(process.env.SMTP_PORT || 587) === 465,
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [
          {
            resolve: "@medusajs/medusa/file-s3",
            id: "s3",
            options: {
              file_url: process.env.S3_FILE_URL,
              access_key_id: process.env.S3_ACCESS_KEY_ID,
              secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
              region: process.env.S3_REGION,
              bucket: process.env.S3_BUCKET,
              endpoint: process.env.S3_ENDPOINT,
            },
          },
        ],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/paypal",
            id: "paypal",
            options: {
              client_id: process.env.PAYPAL_CLIENT_ID!,
              client_secret: process.env.PAYPAL_CLIENT_SECRET!,
              environment: process.env.PAYPAL_ENVIRONMENT || "sandbox",
              autoCapture: process.env.PAYPAL_AUTO_CAPTURE === "true",
              webhook_id: process.env.PAYPAL_WEBHOOK_ID,
            },
          },
          {
            resolve: "@medusajs/medusa/payment-stripe",
            id: "stripe",
            options: {
              apiKey: process.env.STRIPE_API_KEY,
              webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
            },
          },
        ],
      },
    },
    {
      resolve: "./src/modules/facebook-capi",
      options: metaConfig,
    },
    {
      resolve: "./src/modules/product-builder",
    },
    {
      resolve: "./src/modules/invoice-generator",
    },
    {
      resolve: "./src/modules/product-review",
    },
  ],
})
```

---

## Sending Emails with `createNotifications()`

Medusa v2 sends notifications via the Notification Module service.

Example payload structure:

```ts
await notificationModuleService.createNotifications({
  to: "customer@example.com",
  channel: "email",
  template: "customer-created",
  data: {
    customer_id: "cus_123",
  },
  content: {
    subject: "Welcome",
    text: "Your account was created.",
    html: "<p>Your account was created.</p>",
  },
})
```

### Notes

- `channel` must be `email` so the Nodemailer provider is selected.
- `content.subject`, `content.text`, and `content.html` are passed to the email provider.
- `template` can still be used for naming/auditing purposes.

---

## Subscriber-driven Emails

The project includes `src/subscribers/email-test.ts`.

- Event: `customer.created`
- Action: sends a welcome email to the created customer
- Service resolution: `container.resolve(Modules.NOTIFICATION)`

Minimal flow:

1. Medusa emits `customer.created`.
2. Subscriber receives `event.data`.
3. Subscriber calls `createNotifications()` with `channel: "email"`.
4. Nodemailer provider sends via SMTP.

---

## Test Instructions

1. Fill SMTP variables in `.env`.
2. Start backend:

```bash
npm run dev
```

3. Trigger `customer.created` by creating a customer (Store API or Medusa admin).
4. Check logs for notification sending.
5. Confirm the recipient mailbox receives the email.

Expected behavior:

- A notification record is created for channel `email`.
- SMTP provider accepts and sends the message.
- Inbox receives message with subject/text/html from subscriber `content` payload.

---

## Production Best Practices

- Use a dedicated transactional SMTP provider (not personal SMTP accounts).
- Store credentials in secret management, not plain `.env` in production.
- Use domain-authenticated sender addresses (`SPF`, `DKIM`, `DMARC`).
- Monitor SMTP rejection/bounce logs.
- Set `SMTP_FROM` to a verified sender address.
- Consider idempotency keys for critical workflows to avoid duplicates.

---

## Debugging Guide

If emails are not being sent:

1. **Provider registration**
   - Ensure Nodemailer provider is under Notification Module `providers`.
   - Ensure `channels: ["email"]` exists in provider options.

2. **Env vars**
   - Verify `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` are set.
   - Confirm `SMTP_PORT` is numeric.

3. **TLS mismatch**
   - Port `465` should use `secure: true`.
   - Port `587` usually uses `secure: false` (STARTTLS upgrade).

4. **Auth problems**
   - Check if SMTP provider requires app passwords or specific auth methods.
   - Confirm the account is allowed to send from `SMTP_FROM`.

5. **Event not firing**
   - Verify subscriber `config.event` matches the emitted event exactly.
   - Confirm subscriber file is under `src/subscribers`.

6. **Inspect notification records/logs**
   - If a notification is created but no email arrives, issue is likely SMTP/provider-side.
   - If no notification is created, issue is likely event/subscriber wiring.

---

## Common Errors and Fixes

### `No provider found for channel email`

Cause: No notification provider registered for `email`.

Fix: Ensure provider options include `channels: ["email"]`.

### SMTP authentication failed (`535`, `EAUTH`)

Cause: Wrong credentials or provider policy restrictions.

Fix: Re-check `SMTP_USER`/`SMTP_PASS`, app-password requirements, and account security settings.

### Connection timeout (`ETIMEDOUT`, `ECONNREFUSED`)

Cause: Host/port/firewall issue.

Fix: Verify `SMTP_HOST` and `SMTP_PORT`; allow outbound SMTP from deployment environment.

### Mail accepted but not received

Cause: deliverability/spam policy.

Fix: configure SPF/DKIM/DMARC, use verified sender domains, inspect spam/quarantine.

---

## How to Extend

### 1) Add richer templates

- Keep calling `createNotifications()` from workflows/subscribers.
- Build subject/html dynamically from reusable helper functions.
- Store template fragments in a dedicated folder and compose HTML safely.

### 2) Send multiple emails per event

```ts
await notificationModuleService.createNotifications([
  {
    to: customerEmail,
    channel: "email",
    template: "customer-welcome",
    content: { subject: "Welcome", text: "...", html: "<p>...</p>" },
  },
  {
    to: internalOpsEmail,
    channel: "email",
    template: "customer-created-internal",
    content: { subject: "New customer", text: "...", html: "<p>...</p>" },
  },
])
```

### 3) Move email sending into workflows

For higher reliability, trigger notifications in workflows where you can add retry/error-handling semantics explicitly.

### 4) Add attachments

Use the `attachments` array in `createNotifications()` when required (PDF invoices, receipts, etc.).
