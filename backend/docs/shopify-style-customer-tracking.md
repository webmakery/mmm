# Shopify-style Customer Identification & Conversion Tracking for Medusa + Next.js

> Modeled after Shopify’s **public standard event model** (web pixels / standard events) in principle, not private internals.

## 1. SYSTEM DESIGN OVERVIEW

### End-to-end architecture
- **Browser (Next.js)** generates/persists `anonymous_id`, `session_id`, captures attribution, and emits low-cost behavioral events.
- **Tracking API (Medusa custom module)** ingests events with idempotency keys, writes raw events + upserts visitor/session/customer journey state.
- **Core commerce milestones (Medusa source-of-truth):** customer creation/login, order placement, payment confirmation come from backend subscribers/workflows, not browser trust.
- **Async workers/queues** perform heavy operations: stage recomputation, attribution rollups, CRM sync.
- **CRM sync bridge** sends only summarized lead/customer state + milestones.

### Responsibility split
- **Next.js:** anonymous/session identity, UTM/referrer/landing capture, lightweight event emitters (`page_view`, `engaged_visit_5s`, `product_view`, `add_to_cart`, `cart_view`, `checkout_started`, `signup_started`).
- **Medusa:** authoritative identity graph, dedupe/idempotent upserts, stage transitions, attribution chain, order/payment truth, aggregated value metrics.
- **External CRM:** only contact-level summary and lifecycle updates.

### ASCII diagram
```text
┌────────────────────┐      track()      ┌────────────────────────────────┐
│ Next.js storefront │ ────────────────▶ │ Medusa Tracking API            │
│ - anon/session ids │                   │ - event ingest + idempotency   │
│ - UTM capture      │                   │ - raw event store              │
└─────────┬──────────┘                   │ - visitor/session upserts      │
          │ identify/signup/login        │ - identity stitching           │
          └────────────────────────────▶ │ - lifecycle stage updates      │
                                         └──────────────┬─────────────────┘
                                                        │
                                                        │ domain events
                                                        ▼
                                         ┌────────────────────────────────┐
                                         │ Medusa Subscribers/Workflows   │
                                         │ - customer.created             │
                                         │ - order.placed                 │
                                         │ - payment.captured             │
                                         └──────────────┬─────────────────┘
                                                        │ enqueue
                                                        ▼
                                         ┌────────────────────────────────┐
                                         │ Queue Workers                  │
                                         │ - attribution rollups          │
                                         │ - CRM sync retries/idempotency │
                                         └──────────────┬─────────────────┘
                                                        │
                                                        ▼
                                         ┌────────────────────────────────┐
                                         │ External CRM                   │
                                         │ - lead/contact summary only    │
                                         └────────────────────────────────┘
```

## 2. WHAT TO BUILD INSIDE MEDUSA

### Custom module name
- `customer-journey` (path: `backend/src/modules/customer-journey`)

### Entities/Tables
- `journey_visitor`
- `journey_session`
- `journey_event`
- `journey_identity_link`
- `journey_customer_rollup`
- `journey_attribution_touch`
- `journey_crm_sync_log`

### Services
- `JourneyIngestService`
  - `ingestEvent(payload)`
  - `upsertVisitor(...)`
  - `upsertSession(...)`
  - `appendEvent(...)`
- `JourneyIdentityService`
  - `identifyUser({ anonymous_id, customer_id, email })`
  - deterministic stitch + dedupe
- `JourneyLifecycleService`
  - `advanceStage(...)`
  - `recomputeCustomerRollup(customer_id)`
- `JourneyAttributionService`
  - first-touch + last-non-direct assignment
- `JourneyCrmSyncService`
  - queue-enqueued sync with idempotent external upsert

### Subscribers
- `customer.created` → emit `customer_created`, stitch identity, stage=`signed_up`
- `customer.login` (if available via auth hooks/event bus) → stage=`logged_in`
- `order.placed` → emit `order_placed`, stage=`purchased` candidate
- `payment.captured` / `payment.authorized` (finalized payment event) → emit `payment_confirmed`, finalize revenue

### Workflows/Hooks
- Workflow hook from storefront auth/signup endpoint to call `identifyUser`.
- Order completion workflow hook to compute attribution and rollups.

### Queue/Jobs
- `crm.sync.contact`
- `crm.sync.stage`
- `journey.rollup.recompute`
- `journey.attribution.recompute` (for late identity stitching)

### API endpoints
- `POST /store/journey/events`
- `POST /store/journey/identify`
- `POST /store/journey/signup-completed`
- `GET /admin/journey/customer/:customer_id` (debug/support)

## 3. WHAT TO STORE IN THE INTERNAL TRACKING MODULE

### Visitor identity
- `anonymous_id` (stable UUIDv4 in first-party cookie/localStorage)
- `first_seen_at`, `last_seen_at`
- `first_user_agent_hash`, `first_ip_hash` (optional privacy-safe)
- `linked_customer_id` nullable
- `linked_email` nullable

### Session identity
- `session_id` (UUIDv4, 30-min inactivity timeout)
- `anonymous_id`
- `started_at`, `ended_at`, `is_bounce`
- `landing_page`, `referrer`

### Attribution
- `utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`
- `referrer_host`
- `first_touch_*` snapshot
- `last_touch_*` snapshot

### Lifecycle stage
- enum: `anonymous_visitor|engaged_visitor|signed_up|logged_in|cart_started|checkout_started|purchased|repeat_customer`
- `stage_updated_at`
- `stage_history` (events derive this; optional materialized table)

### Cart/checkout state
- current `cart_id`
- `cart_started_at`
- `checkout_started_at`
- `checkout_count`

### Purchase history
- `orders_count`
- `first_order_id`, `first_order_at`
- `last_order_id`, `last_order_at`
- `total_gross_revenue`, `total_net_revenue`

### Aggregated customer value
- `aov`
- `ltv`
- `days_to_first_purchase`
- `source_first_touch`, `source_last_touch`

## 4. WHAT TO SYNC TO THE EXTERNAL CRM

### Send to CRM
- Contact keys: `customer_id`, `email`, `anonymous_id` (if no customer yet)
- Acquisition: `first_touch_source/medium/campaign`, `landing_page`, `referrer_host`, `first_seen_at`
- Lifecycle: current stage + timestamp
- Conversion milestones: `signup_completed_at`, `first_checkout_started_at`, `first_order_at`, `last_order_at`
- Revenue summary: `orders_count`, `total_revenue`, `ltv`, `aov`
- Optional lead score flag based on engagement

### Do NOT send to CRM
- Raw `page_view` stream
- Full clickstream/session event logs
- Per-product view exhaust data
- High-frequency event duplicates/debug payloads

## 5. IDENTITY MODEL

- `anonymous_id`: client-generated persistent pseudonymous identifier before auth.
- `session_id`: browser session scope identifier (rotates by inactivity/new tab policy).
- `customer_id`: Medusa canonical customer primary key.
- `email`: normalized lowercase email used as secondary stitch key.
- `crm_contact_id`: external CRM contact record id after successful upsert.
- `cart_id`: Medusa cart id for cart/checkout journey continuity.
- `order_id`: Medusa order id for purchase + revenue truth.

## 6. IDENTITY STITCHING LOGIC

Matching priority:
1. `customer_id`
2. `email`
3. `anonymous_id`

Upsert/dedupe flow:
1. If `customer_id` present: lock customer rollup row, attach all seen `anonymous_id`s.
2. Else if email present: lookup existing customer/contact by normalized email; merge anonymous profile into found entity.
3. Else fallback to anonymous visitor row only.
4. On merge conflicts, keep earliest `first_seen_at`; keep most recent `last_seen_at`; union attribution touches without duplicates.
5. Record merge in `journey_identity_link` with deterministic key:
   - `identity_key = sha256(customer_id||email||anonymous_id)`
6. Every write uses idempotency key (event-level) and DB unique constraints.

## 7. EVENT TAXONOMY

| Event | Source | Payload (core) | Fired when | Truth type | Dedupe key |
|---|---|---|---|---|---|
| `page_view` | Frontend | `anonymous_id,session_id,url,title,utm*,referrer,ts` | Route/page visible | analytics-only | `sha256(session_id+url+rounded_ts_1s)` |
| `engaged_visit_5s` | Frontend | `anonymous_id,session_id,url,ts` | 5s active on page (once/page) | analytics-only | `sha256(session_id+url+engaged)` |
| `product_view` | Frontend | `anonymous_id,session_id,product_id,variant_id,ts` | PDP viewed | analytics-only | `sha256(session_id+product_id+rounded_ts_2s)` |
| `add_to_cart` | Frontend | `anonymous_id,session_id,cart_id,product_id,qty,ts` | Add action succeeds | mixed | `sha256(cart_id+product_id+qty+client_event_id)` |
| `cart_view` | Frontend | `anonymous_id,session_id,cart_id,ts` | Cart page opened | analytics-only | `sha256(session_id+cart_id+cart_view)` |
| `checkout_started` | Frontend + Backend verify | `anonymous_id,session_id,cart_id,checkout_id,ts` | Checkout initiated | backend-verified | `sha256(cart_id+checkout_id+started)` |
| `signup_started` | Frontend | `anonymous_id,session_id,ts` | Signup form submit start | analytics-only | `sha256(session_id+signup_started+minute)` |
| `signup_completed` | Backend/API | `customer_id,email,anonymous_id,ts` | Customer account creation success | source-of-truth | `sha256(customer_id+signup_completed)` |
| `customer_created` | Backend subscriber | `customer_id,email,ts` | Medusa customer.created | source-of-truth | `sha256(customer_id+created)` |
| `order_placed` | Backend subscriber | `order_id,customer_id,cart_id,total,currency,ts` | Medusa order.placed | source-of-truth | `sha256(order_id+placed)` |
| `payment_confirmed` | Backend subscriber | `payment_id,order_id,customer_id,amount,ts` | payment captured/confirmed | source-of-truth | `sha256(payment_id+confirmed)` |

## 8. NEXT.JS IMPLEMENTATION

```ts
// frontend/src/lib/journey/client.ts
"use client"

import { v4 as uuidv4 } from "uuid"

type TrackingEvent = {
  event_name: string
  anonymous_id: string
  session_id: string
  event_id: string
  occurred_at: string
  payload: Record<string, unknown>
}

const ANON_KEY = "journey_anonymous_id"
const SESSION_KEY = "journey_session"
const ATTR_KEY = "journey_attribution"
const SESSION_TIMEOUT_MS = 30 * 60 * 1000

type SessionState = { id: string; lastSeenAt: number }

type Attribution = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer?: string
  landing_page?: string
  first_seen_at?: string
}

export function getAnonymousId(): string {
  const fromStorage = localStorage.getItem(ANON_KEY)
  if (fromStorage) return fromStorage
  const id = uuidv4()
  localStorage.setItem(ANON_KEY, id)
  document.cookie = `${ANON_KEY}=${id}; Path=/; Max-Age=31536000; SameSite=Lax`
  return id
}

export function getSessionId(now = Date.now()): string {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (raw) {
    const parsed = JSON.parse(raw) as SessionState
    if (now - parsed.lastSeenAt < SESSION_TIMEOUT_MS) {
      const updated = { ...parsed, lastSeenAt: now }
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated))
      return parsed.id
    }
  }
  const created: SessionState = { id: uuidv4(), lastSeenAt: now }
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(created))
  return created.id
}

export function captureAttribution(): Attribution {
  const currentUrl = new URL(window.location.href)
  const existing = localStorage.getItem(ATTR_KEY)
  if (existing) return JSON.parse(existing) as Attribution

  const attr: Attribution = {
    utm_source: currentUrl.searchParams.get("utm_source") ?? undefined,
    utm_medium: currentUrl.searchParams.get("utm_medium") ?? undefined,
    utm_campaign: currentUrl.searchParams.get("utm_campaign") ?? undefined,
    referrer: document.referrer || undefined,
    landing_page: `${currentUrl.pathname}${currentUrl.search}`,
    first_seen_at: new Date().toISOString(),
  }
  localStorage.setItem(ATTR_KEY, JSON.stringify(attr))
  return attr
}

async function sendEvent(event: TrackingEvent): Promise<void> {
  await fetch("/store/journey/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(event),
    keepalive: true,
  })
}

export async function trackPageView(url: string, title?: string): Promise<void> {
  const anonymous_id = getAnonymousId()
  const session_id = getSessionId()
  const attribution = captureAttribution()

  await sendEvent({
    event_name: "page_view",
    event_id: crypto.randomUUID(),
    anonymous_id,
    session_id,
    occurred_at: new Date().toISOString(),
    payload: { url, title, ...attribution },
  })

  const engagedKey = `engaged:${session_id}:${url}`
  if (!sessionStorage.getItem(engagedKey)) {
    window.setTimeout(() => {
      if (document.visibilityState === "visible") {
        sessionStorage.setItem(engagedKey, "1")
        void sendEvent({
          event_name: "engaged_visit_5s",
          event_id: crypto.randomUUID(),
          anonymous_id,
          session_id,
          occurred_at: new Date().toISOString(),
          payload: { url },
        })
      }
    }, 5000)
  }
}

export async function identifyAfterSignup(input: {
  customer_id: string
  email: string
}): Promise<void> {
  await fetch("/store/journey/identify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      anonymous_id: getAnonymousId(),
      session_id: getSessionId(),
      ...input,
    }),
  })
}

export async function trackCartAndCheckout(input: {
  event_name: "add_to_cart" | "cart_view" | "checkout_started"
  cart_id: string
  product_id?: string
  quantity?: number
  checkout_id?: string
}): Promise<void> {
  await sendEvent({
    event_name: input.event_name,
    event_id: crypto.randomUUID(),
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    occurred_at: new Date().toISOString(),
    payload: input,
  })
}
```

## 9. MEDUSA IMPLEMENTATION

```ts
// backend/src/modules/customer-journey/index.ts
import { Module } from "@medusajs/framework/utils"
import JourneyService from "./service"

export const CUSTOMER_JOURNEY_MODULE = "customerJourney"

export default Module(CUSTOMER_JOURNEY_MODULE, {
  service: JourneyService,
})
```

```ts
// backend/src/modules/customer-journey/service.ts
import {
  MedusaService,
  InjectManager,
  MedusaContext,
} from "@medusajs/framework/utils"
import JourneyVisitor from "./models/journey-visitor"
import JourneySession from "./models/journey-session"
import JourneyEvent from "./models/journey-event"

class JourneyService extends MedusaService({ JourneyVisitor, JourneySession, JourneyEvent }) {
  @InjectManager()
  async ingestEvent(input: {
    event_id: string
    event_name: string
    anonymous_id: string
    session_id: string
    occurred_at: string
    payload: Record<string, unknown>
  }, @MedusaContext() ctx?: Record<string, unknown>) {
    const exists = await this.listJourneyEvents({ event_id: input.event_id }, {}, ctx)
    if (exists.length) return exists[0]

    await this.upsertVisitor({ anonymous_id: input.anonymous_id }, ctx)
    await this.upsertSession({ session_id: input.session_id, anonymous_id: input.anonymous_id }, ctx)

    const [created] = await this.createJourneyEvents([input], ctx)
    return created
  }

  @InjectManager()
  async identifyUser(input: {
    anonymous_id: string
    customer_id?: string
    email?: string
  }, @MedusaContext() ctx?: Record<string, unknown>) {
    const normalizedEmail = input.email?.trim().toLowerCase()
    const visitor = await this.ensureVisitor(input.anonymous_id, ctx)

    if (input.customer_id) {
      await this.updateJourneyVisitors({ id: visitor.id, customer_id: input.customer_id, email: normalizedEmail }, ctx)
      return
    }

    if (normalizedEmail) {
      const matched = await this.listJourneyVisitors({ email: normalizedEmail }, { take: 1 }, ctx)
      if (matched[0]) {
        await this.mergeVisitors(matched[0].id, visitor.id, ctx)
      } else {
        await this.updateJourneyVisitors({ id: visitor.id, email: normalizedEmail }, ctx)
      }
    }
  }

  private async ensureVisitor(anonymous_id: string, ctx?: Record<string, unknown>) {
    const found = await this.listJourneyVisitors({ anonymous_id }, { take: 1 }, ctx)
    if (found[0]) return found[0]
    const [created] = await this.createJourneyVisitors([{ anonymous_id }], ctx)
    return created
  }
}

export default JourneyService
```

```ts
// backend/src/subscribers/customer-created.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"

export default async function customerCreatedHandler({ event, container }: SubscriberArgs<{ id: string; email?: string; metadata?: Record<string, unknown> }>) {
  const service = container.resolve(CUSTOMER_JOURNEY_MODULE)
  await service.identifyUser({
    anonymous_id: String(event.metadata?.anonymous_id ?? ""),
    customer_id: event.id,
    email: event.email,
  })
  await service.ingestEvent({
    event_id: `customer_created_${event.id}`,
    event_name: "customer_created",
    anonymous_id: String(event.metadata?.anonymous_id ?? "unknown"),
    session_id: String(event.metadata?.session_id ?? "unknown"),
    occurred_at: new Date().toISOString(),
    payload: { customer_id: event.id, email: event.email },
  })
}

export const config: SubscriberConfig = {
  event: "customer.created",
}
```

```ts
// backend/src/subscribers/order-placed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"

export default async function orderPlacedHandler({ event, container }: SubscriberArgs<{ id: string; customer_id?: string; cart_id?: string; total?: number; currency_code?: string }>) {
  const service = container.resolve(CUSTOMER_JOURNEY_MODULE)
  await service.ingestEvent({
    event_id: `order_placed_${event.id}`,
    event_name: "order_placed",
    anonymous_id: "backend",
    session_id: "backend",
    occurred_at: new Date().toISOString(),
    payload: {
      order_id: event.id,
      customer_id: event.customer_id,
      cart_id: event.cart_id,
      total: event.total,
      currency_code: event.currency_code,
    },
  })
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
```

```ts
// backend/src/subscribers/payment-confirmed.ts
import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"
import { CUSTOMER_JOURNEY_MODULE } from "../modules/customer-journey"

export default async function paymentConfirmedHandler({ event, container }: SubscriberArgs<{ id: string; order_id?: string; customer_id?: string; amount?: number }>) {
  const service = container.resolve(CUSTOMER_JOURNEY_MODULE)
  await service.ingestEvent({
    event_id: `payment_confirmed_${event.id}`,
    event_name: "payment_confirmed",
    anonymous_id: "backend",
    session_id: "backend",
    occurred_at: new Date().toISOString(),
    payload: {
      payment_id: event.id,
      order_id: event.order_id,
      customer_id: event.customer_id,
      amount: event.amount,
    },
  })
}

export const config: SubscriberConfig = {
  event: "payment.captured",
}
```

```ts
// backend/src/jobs/crm-sync-contact.ts
import type { Job } from "@medusajs/framework/types"

export default async function crmSyncContactJob({ data, container }: Job<{ customer_id: string }>) {
  const journey = container.resolve("customerJourney")
  const crmClient = container.resolve("crmClient")

  const rollup = await journey.getCustomerRollup(data.customer_id)
  const idempotencyKey = `crm_contact_${rollup.customer_id}_${rollup.updated_at}`

  await crmClient.upsertContact({
    idempotency_key: idempotencyKey,
    customer_id: rollup.customer_id,
    email: rollup.email,
    stage: rollup.lifecycle_stage,
    orders_count: rollup.orders_count,
    total_revenue: rollup.total_revenue,
    first_touch_source: rollup.first_touch_source,
    last_touch_source: rollup.last_touch_source,
  })
}
```

## 10. DATABASE DESIGN

### `journey_visitor`
- `id` pk
- `anonymous_id` unique index
- `customer_id` index nullable
- `email` index nullable
- `lifecycle_stage` index
- `first_seen_at`, `last_seen_at`
- `first_touch_source`, `first_touch_medium`, `first_touch_campaign`
- `last_touch_source`, `last_touch_medium`, `last_touch_campaign`
- `created_at`, `updated_at`

### `journey_session`
- `id` pk
- `session_id` unique index
- `anonymous_id` index
- `visitor_id` fk -> `journey_visitor.id`
- `landing_page`, `referrer`, `referrer_host`
- `utm_source`, `utm_medium`, `utm_campaign`
- `started_at`, `ended_at`

### `journey_event`
- `id` pk
- `event_id` unique index (idempotency)
- `event_name` index
- `visitor_id` fk nullable
- `session_id` fk nullable
- `customer_id` index nullable
- `order_id` index nullable
- `cart_id` index nullable
- `occurred_at` index
- `payload` jsonb

### `journey_customer_rollup`
- `id` pk
- `customer_id` unique index
- `email`
- `lifecycle_stage`
- `orders_count`
- `total_revenue`
- `aov`
- `ltv`
- `first_order_at`, `last_order_at`
- `first_touch_source`, `last_touch_source`
- `crm_contact_id` nullable
- `updated_at`

### `journey_identity_link`
- `id` pk
- `anonymous_id` index
- `customer_id` index nullable
- `email` index nullable
- `identity_key` unique index
- `linked_at`

### `journey_crm_sync_log`
- `id` pk
- `customer_id` index
- `sync_type` (`contact_upsert|stage_update`)
- `idempotency_key` unique index
- `status` index
- `attempt_count`
- `last_error` text nullable
- `synced_at`

## 11. API CONTRACTS

### `page_view`
```json
{
  "event_name": "page_view",
  "event_id": "evt_01H...",
  "anonymous_id": "anon_abc123",
  "session_id": "sess_xyz456",
  "occurred_at": "2026-04-18T10:00:00.000Z",
  "payload": {
    "url": "/products/t-shirt",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "spring_sale",
    "referrer": "https://www.google.com/",
    "landing_page": "/products/t-shirt?utm_source=google"
  }
}
```

### `identify_user`
```json
{
  "anonymous_id": "anon_abc123",
  "session_id": "sess_xyz456",
  "customer_id": "cus_123",
  "email": "user@example.com"
}
```

### `signup_completed`
```json
{
  "event_name": "signup_completed",
  "event_id": "signup_cus_123",
  "customer_id": "cus_123",
  "email": "user@example.com",
  "anonymous_id": "anon_abc123",
  "occurred_at": "2026-04-18T10:02:30.000Z"
}
```

### `checkout_started`
```json
{
  "event_name": "checkout_started",
  "event_id": "evt_checkout_001",
  "anonymous_id": "anon_abc123",
  "session_id": "sess_xyz456",
  "payload": {
    "cart_id": "cart_987",
    "checkout_id": "chk_001"
  }
}
```

### `order_placed`
```json
{
  "event_name": "order_placed",
  "event_id": "order_placed_ord_123",
  "payload": {
    "order_id": "ord_123",
    "customer_id": "cus_123",
    "cart_id": "cart_987",
    "total": 12900,
    "currency_code": "usd"
  }
}
```

### `crm_upsert_contact`
```json
{
  "idempotency_key": "crm_contact_cus_123_2026-04-18T10:05:00.000Z",
  "customer_id": "cus_123",
  "email": "user@example.com",
  "lifecycle_stage": "purchased",
  "first_touch_source": "google",
  "last_touch_source": "email",
  "orders_count": 2,
  "total_revenue": 25800,
  "aov": 12900
}
```

### `crm_update_stage`
```json
{
  "idempotency_key": "crm_stage_cus_123_purchased_2026-04-18",
  "customer_id": "cus_123",
  "lifecycle_stage": "purchased",
  "stage_updated_at": "2026-04-18T10:05:00.000Z"
}
```

## 12. SCALABILITY / SAFETY

- Emit `engaged_visit_5s` **once per page per session** (sessionStorage key guard).
- No heartbeat polling (no per-second traffic).
- Debounce repeated UI events (e.g., rapid add-to-cart clicks) on client.
- Use lightweight HTTP ingest and batch expensive enrichments in queue workers.
- CRM sync strictly async via queue with exponential backoff.
- Idempotency:
  - unique `event_id` in event table
  - unique sync idempotency keys in CRM sync log
- Failure recovery:
  - retry transient failures
  - dead-letter queue for poison messages
  - replay job for unsynced rollups
- Partition/TTL strategy for raw events (e.g., monthly partitions, 90–180 day retention).

## 13. REPORTING MODEL

Use SQL/materialized views from `journey_event` + `journey_customer_rollup`:

- **Traffic by source:** distinct sessions grouped by first-touch `utm_source`.
- **Engaged visitors by source:** count visitors with `engaged_visit_5s` grouped by source.
- **Signup rate by source:** `signed_up visitors / anonymous visitors` by source.
- **Checkout rate by source:** visitors with `checkout_started / engaged visitors` by source.
- **Purchase rate by source:** customers with `payment_confirmed / checkout_started` by source.
- **Revenue by source:** sum confirmed order totals grouped by attribution model (first-touch and last-touch views).
- **Funnel dropoff by stage:** stage-to-stage conversion matrix from lifecycle transitions.

## 14. FINAL IMPLEMENTATION PLAN

### Phase 1 (Foundation)
1. Create `customer-journey` module + migrations + ingest/identify APIs.
2. Add Next.js client tracker for `anonymous_id`, `session_id`, attribution, `page_view`, `engaged_visit_5s`.
3. Add unique idempotency constraints and baseline dashboards.

### Phase 2 (Truth + Stitching)
1. Add Medusa subscribers for `customer.created`, `order.placed`, `payment.captured`.
2. Implement identity stitching + lifecycle stage advancement.
3. Implement rollup job for value/revenue metrics.

### Phase 3 (CRM + Optimization)
1. Implement async CRM sync jobs (contact upsert + stage updates).
2. Add retry/DLQ/replay tooling and sync observability.
3. Add attribution/funnel reporting views and retention/partition tuning.
