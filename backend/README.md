<p align="center">
  <a href="https://www.medusajs.com">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://user-images.githubusercontent.com/59018053/229103275-b5e482bb-4601-46e6-8142-244f531cebdb.svg">
    <source media="(prefers-color-scheme: light)" srcset="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    <img alt="Medusa logo" src="https://user-images.githubusercontent.com/59018053/229103726-e5b529a3-9b3f-4970-8a1f-c6af37f087bf.svg">
    </picture>
  </a>
</p>
<h1 align="center">
  Medusa
</h1>

<h4 align="center">
  <a href="https://docs.medusajs.com">Documentation</a> |
  <a href="https://www.medusajs.com">Website</a>
</h4>

<p align="center">
  Building blocks for digital commerce
</p>
<p align="center">
  <a href="https://github.com/medusajs/medusa/blob/master/CONTRIBUTING.md">
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat" alt="PRs welcome!" />
  </a>
    <a href="https://www.producthunt.com/posts/medusa"><img src="https://img.shields.io/badge/Product%20Hunt-%231%20Product%20of%20the%20Day-%23DA552E" alt="Product Hunt"></a>
  <a href="https://discord.gg/xpCwq3Kfn8">
    <img src="https://img.shields.io/badge/chat-on%20discord-7289DA.svg" alt="Discord Chat" />
  </a>
  <a href="https://twitter.com/intent/follow?screen_name=medusajs">
    <img src="https://img.shields.io/twitter/follow/medusajs.svg?label=Follow%20@medusajs" alt="Follow @medusajs" />
  </a>
</p>

## Compatibility

This starter is compatible with versions >= 2 of `@medusajs/medusa`. 

## Getting Started

Visit the [Quickstart Guide](https://docs.medusajs.com/learn/installation) to set up a server.

Visit the [Docs](https://docs.medusajs.com/learn/installation#get-started) to learn more about our system requirements.

## What is Medusa

Medusa is a set of commerce modules and tools that allow you to build rich, reliable, and performant commerce applications without reinventing core commerce logic. The modules can be customized and used to build advanced ecommerce stores, marketplaces, or any product that needs foundational commerce primitives. All modules are open-source and freely available on npm.

Learn more about [Medusa’s architecture](https://docs.medusajs.com/learn/introduction/architecture) and [commerce modules](https://docs.medusajs.com/learn/fundamentals/modules/commerce-modules) in the Docs.

## Build with AI Agents

### Claude Code Plugin

If you use AI agents like Claude Code, check out the [medusa-dev Claude Code plugin](https://github.com/medusajs/medusa-claude-plugins).

### Other Agents

If you use AI agents other than Claude Code, copy the [skills directory](https://github.com/medusajs/medusa-claude-plugins/tree/main/plugins/medusa-dev/skills) into your agent's relevant `skills` directory.

### MCP Server

You can also add the MCP server `https://docs.medusajs.com/mcp` to your AI agents to answer questions related to Medusa. The `medusa-dev` Claude Code plugin includes this MCP server by default.

## Community & Contributions

The community and core team are available in [GitHub Discussions](https://github.com/medusajs/medusa/discussions), where you can ask for support, discuss roadmap, and share ideas.

Join our [Discord server](https://discord.com/invite/medusajs) to meet other community members.

## Other channels

- [GitHub Issues](https://github.com/medusajs/medusa/issues)
- [Twitter](https://twitter.com/medusajs)
- [LinkedIn](https://www.linkedin.com/company/medusajs)
- [Medusa Blog](https://medusajs.com/blog/)

## Custom domains (Caddy + on-demand TLS)

### Environment variables

- `PLATFORM_DOMAIN_TARGET_HOST` (required fallback): shared/default target host if no store-specific target host is configured.
- `CUSTOM_DOMAIN_TARGET_HOST` (optional): instance-specific target host override.
- `CUSTOM_DOMAIN_TARGET_IP` (optional): instance-specific ingress IP used for apex/root domain A records.
- `VPS_PUBLIC_IP` (optional fallback): ingress IP when `CUSTOM_DOMAIN_TARGET_IP` is not set.
- `INTERNAL_CUSTOM_DOMAIN_SECRET` (recommended): shared secret for Caddy ask endpoint.

Store metadata can also override DNS targets with:

- `custom_domain_target_host` (or `domain_target_host` / `instance_host`)
- `custom_domain_target_ip` (or `domain_target_ip` / `instance_ip`)

### API flow

1. `POST /admin/custom-domains` with `{ "domain": "shop.brand.com" }`.
2. API returns normalized domain, status (`pending_dns`), and DNS instructions with record type/host/value derived from the store's dedicated target host/IP.
3. Worker job `verify-pending-custom-domains` checks DNS every 10 minutes.
4. Domain status becomes `active` when DNS target matches expected value.
5. Caddy asks `/internal/custom-domains/can-issue-cert?domain=shop.brand.com` on first TLS handshake.
6. If allowed, certificate is issued and storefront is proxied to `127.0.0.1:3000`.

### Caddy setup

Use `docs/caddy/Caddyfile.custom-domains.example` and update:

- global email address.
- ask endpoint port (`9000` above should match your Medusa API bind port).
- optionally pass `x-internal-secret: $INTERNAL_CUSTOM_DOMAIN_SECRET` from a trusted local proxy if not restricting to loopback.

Safe reload command example:

```bash
caddy validate --config /etc/caddy/Caddyfile && caddy reload --config /etc/caddy/Caddyfile
```


## Sales CRM (Leads)

### Files and structure

- Module: `src/modules/lead`
  - models: `lead`, `lead_stage`, `lead_activity`
  - service: filtering and listing logic for leads
  - loader: seeds default pipeline stages (`new`, `contacted`, `qualified`, `proposal`, `won`, `lost`)
- Workflows: `src/workflows/lead/*`
  - `createLeadWorkflow`
  - `updateLeadWorkflow`
  - `moveLeadStageWorkflow`
  - `addLeadActivityWorkflow`
  - `scheduleFollowUpWorkflow`
  - `convertLeadToCustomerWorkflow`
- Admin API routes: `src/api/admin/leads/*` and `src/api/admin/lead-stages/route.ts`
- Admin pages: `src/admin/routes/leads/*`

### Run migrations

```bash
npm run medusa migrations run
```

### Test the feature quickly

1. Open Admin and go to **Leads**.
2. Create leads using `POST /admin/leads` or your admin integration.
3. Move stage from lead details or the Pipeline page.
4. Add activities (`note`, `call`, `email`, `meeting`, `task`) from lead details.
5. Use follow-up fields/filters with `next_follow_up_at` and task activities.
6. Convert lead with `POST /admin/leads/:id/convert`.

## CRM Setup & Verification

1. Run migrations:

```bash
npx medusa migrations run
```

2. Run CRM seed data:

```bash
npm run seed:crm
```

3. Verify in Admin:
   - Open `/app/leads` and confirm sample leads are listed.
   - Open `/app/leads/pipeline` and confirm cards appear under stages.
   - Click **Create Lead** on `/app/leads`, submit the form, and confirm the lead appears immediately.

4. Example API request to create a lead:

```bash
curl -X POST "http://localhost:9000/admin/leads" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  --data '{
    "first_name": "Taylor",
    "last_name": "Johnson",
    "email": "taylor.johnson@example.com",
    "company": "Acme Inc",
    "source": "manual",
    "status": "new"
  }'
```

## Lead conversion flow

`convertLeadToCustomerWorkflow` validates that lead email exists, reuses an existing customer by email when available, otherwise creates a new customer, then updates `lead.customer_id`, sets status to `won`, moves the lead to the `won` stage, and logs a `status_change` activity.
