# WooCommerce template compatibility update guide (no design change)

This guide is for themes that show:

> "Your theme contains outdated copies of some WooCommerce template files"

Goal: remove outdated-template warnings **without redesigning the storefront**.

## Safe strategy

1. Keep your current theme overrides as the source of design/custom markup.
2. Compare each override with the latest WooCommerce core template.
3. Port your customizations onto the latest core template structure (hooks, nonces, attributes, ARIA labels, escaping updates).
4. Verify behavior with cart, checkout, account, and single-product flows.
5. Only after verification, keep the updated file and matching `@version` in the template header.

## Why not only edit `@version`?

Changing only the `@version` comment can hide admin warnings, but it does **not** actually apply compatibility updates from newer WooCommerce templates.

## Fast workflow for a large override set

For each file in `wp-content/themes/<your-theme>/woocommerce/...`:

- Open latest source from `wp-content/plugins/woocommerce/templates/...`.
- Run a 3-way merge:
  - base: old WooCommerce template version your override started from
  - ours: your current override
  - theirs: latest WooCommerce template
- Resolve conflicts by keeping your branding/layout and adopting new WooCommerce logic/hooks.

## Priority order

When many files are outdated, update these first:

1. `cart/*`
2. `checkout/*`
3. `single-product/add-to-cart/*`
4. `global/quantity-input.php`
5. `single-product/product-image.php`
6. `myaccount/*`

These templates are most affected by WooCommerce release changes.

## Professional update runbook

Use this sequence in a disposable branch and test with `WP_DEBUG` enabled.

```bash
# 1) Work in a feature branch
git checkout -b chore/woocommerce-template-compat

# 2) Audit override versions
node scripts/check-woocommerce-template-versions.mjs \
  --theme wp-content/themes/<your-theme>/woocommerce \
  --plugin wp-content/plugins/woocommerce/templates

# 3) Update one outdated template at a time (example)
code wp-content/themes/<your-theme>/woocommerce/cart/cart.php
code wp-content/plugins/woocommerce/templates/cart/cart.php

# 4) Validate syntax before browser testing
php -l wp-content/themes/<your-theme>/woocommerce/cart/cart.php
```

## Regression checklist (must pass)

- Cart add/remove/update works.
- Coupons, shipping calculator, totals, and taxes update correctly.
- Checkout: guest + logged-in, billing/shipping validation, payment method switch, order placement.
- Product pages: simple, variable, grouped, external add-to-cart.
- My Account: login/register/reset/edit-address/edit-account/orders.
- Mini-cart and cross-sells render correctly.
- No PHP warnings/notices/fatal errors with `WP_DEBUG` on.

## CI guard (recommended)

Add this to CI so outdated template overrides fail the pipeline:

```bash
node scripts/check-woocommerce-template-versions.mjs \
  --theme wp-content/themes/<your-theme>/woocommerce \
  --plugin wp-content/plugins/woocommerce/templates
```

Exit codes:

- `0`: all overrides are version-compatible
- `1`: outdated/missing template compatibility issues found
- `2`: invalid paths or usage
