# Gmail Inbox Sync for Medusa Inbox

This module extension adds Gmail as a unified inbox channel (`email`) and syncs Gmail threads/messages into the existing inbox conversation/message data model.

## Environment variables

Add these backend env vars:

- `GMAIL_OAUTH_CLIENT_ID`
- `GMAIL_OAUTH_CLIENT_SECRET`
- `GMAIL_OAUTH_REDIRECT_URI`
- `GMAIL_OAUTH_SCOPES` (optional)

Default scopes used when `GMAIL_OAUTH_SCOPES` is omitted:

- `https://www.googleapis.com/auth/gmail.modify`
- `https://www.googleapis.com/auth/gmail.send`
- `https://www.googleapis.com/auth/userinfo.email`

## OAuth and sync API flow

1. Request an authorization URL:
   - `GET /admin/inbox/email/oauth?state=<csrf-state>`
2. In your frontend/admin OAuth callback, send the code to:
   - `POST /admin/inbox/email/connect` with body `{ "code": "..." }`
3. Trigger mailbox sync:
   - `POST /admin/inbox/email/sync` with optional body `{ "account_email": "foo@bar.com", "limit": 20 }`

## Data mapping

- Gmail `threadId` -> `conversation.external_thread_id`
- Gmail message `id` -> `message.external_message_id`
- Thread-level subject -> `conversation.subject`
- Gmail headers/snippet/body -> `message.metadata`, `message.text`, and `message.content`

## Reply threading behavior

Outbound replies to `email` conversations use Gmail API `users.messages.send` with:

- `threadId` set from `conversation.external_thread_id`
- `In-Reply-To` from the latest inbound Gmail `Message-Id` header
- `References` from prior Gmail headers where available

This preserves Gmail thread continuity in the recipient inbox.

## Migration

Run module migrations so `email` is accepted by provider/channel check constraints:

- `yarn medusa db:migrate`
