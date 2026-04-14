# Facebook CAPI Module

Custom Medusa v2 module for sending events to Facebook Conversions API.

## Supported events

- `Purchase` from Medusa order completion events (`order.placed`, `order.completed`).
- `AddToCart` from cart events (`cart.line_item_added`, selected `cart.updated` actions).
- `InitiateCheckout` from cart checkout events (`cart.checkout_started`, selected `cart.updated` actions).

## Environment variables

```bash
FACEBOOK_CAPI_ENABLED=true
FACEBOOK_CAPI_PIXEL_ID=123456789012345
FACEBOOK_CAPI_ACCESS_TOKEN=EAAB...
FACEBOOK_CAPI_TEST_EVENT_CODE=TEST12345 # optional
FACEBOOK_CAPI_API_VERSION=v20.0 # optional, default v20.0
FACEBOOK_CAPI_TIMEOUT_MS=5000 # optional
FACEBOOK_CAPI_MAX_RETRIES=2 # optional
```

## Configuration snippet

`medusa-config.ts`:

```ts
modules: [
  {
    resolve: "./src/modules/facebook-capi",
    options: {
      enabled: process.env.FACEBOOK_CAPI_ENABLED === "true",
      pixelId: process.env.FACEBOOK_CAPI_PIXEL_ID,
      accessToken: process.env.FACEBOOK_CAPI_ACCESS_TOKEN,
      testEventCode: process.env.FACEBOOK_CAPI_TEST_EVENT_CODE,
      apiVersion: process.env.FACEBOOK_CAPI_API_VERSION,
      timeoutMs: process.env.FACEBOOK_CAPI_TIMEOUT_MS
        ? Number(process.env.FACEBOOK_CAPI_TIMEOUT_MS)
        : undefined,
      maxRetries: process.env.FACEBOOK_CAPI_MAX_RETRIES
        ? Number(process.env.FACEBOOK_CAPI_MAX_RETRIES)
        : undefined,
    },
  },
]
```

## Notes

- The module hashes user identifiers before sending (`email`, `phone`, `external_id`).
- It includes `event_id` for deduplication on Facebook's side.
- It prevents duplicate sends within a process lifetime via in-memory `event_id` tracking.
