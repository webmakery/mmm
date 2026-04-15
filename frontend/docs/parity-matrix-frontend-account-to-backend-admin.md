# Frontend ↔ Backend UI Parity Matrix (Account Area)

This matrix inventories the customer account targets in `/frontend` and maps each to the closest reusable admin pattern in `/backend/src/admin`.

## Rollout phases (execution order)

1. **Phase 1: Login/Signup**
2. **Phase 2: Dashboard shell + core widgets**
3. **Phase 3: Remaining dashboard pages/states**

All implementation, QA, and release tracking should follow this exact phase order.

## Responsive checkpoints (aligned to admin UI shell behavior)

The admin shell and route patterns are treated as the responsive source of truth (`backend/node_modules/@medusajs/dashboard/src/components/layout/shell/shell.tsx` + mapped admin route pages). For parity work in frontend account pages, use these checkpoints:

- **Mobile / small**: `< 1024px` (`max-lg` behavior in admin shell; mobile sidebar/drawer behavior)
- **Desktop**: `>= 1024px` (`lg` behavior in admin shell; desktop sidebar/content split)
- **Wide desktop**: constrained content width with centered gutter (`max-w-[1600px]` in admin shell gutter)

Note: frontend also exposes additional design-system breakpoints (`2xsmall`, `xsmall`, `small`, `medium`, `large`, etc.), but parity enforcement for account layout behavior follows the admin shell collapse boundary at `1024px`.

## Target pages in `/frontend`

### Auth targets
- Login: `/frontend/src/app/[countryCode]/(main)/account/@login/page.tsx`
- Signup (same route via view switch): `/frontend/src/modules/account/components/register/index.tsx`

### Dashboard home and subviews
- Dashboard home overview: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/page.tsx`
- Profile: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/profile/page.tsx`
- Addresses: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/addresses/page.tsx`
- Orders: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/orders/page.tsx`
- Order details: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/orders/details/[id]/page.tsx`
- Return request: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/orders/return/[id]/page.tsx`
- Subscriptions: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/subscriptions/page.tsx`
- Digital products: `/frontend/src/app/[countryCode]/(main)/account/@dashboard/digital-products/page.tsx`

## Parity matrix

| Frontend target | Backend source (most similar admin page/pattern) | Reused component(s) / API shape to enforce |
|---|---|---|
| Login | `backend/src/admin/routes/settings/invoice-config/page.tsx` | Form section pattern with `Container`, `Heading`, `Label`, `Input`, submit `Button`; standard vertical field groups and existing spacing classes only. |
| Signup | `backend/src/admin/routes/settings/invoice-config/page.tsx` + `backend/src/admin/routes/subscriptions/subscription-plans/page.tsx` | Multi-field form pattern (`Input`, `Label`, submit `Button`) and optional `Select`/`Switch` interactions from existing drawer-form pattern; no custom form styling. |
| Dashboard home (overview) | `backend/src/admin/routes/subscriptions/page.tsx` + `backend/src/admin/routes/reviews/page.tsx` | Summary-in-container + list/table presentation: `Container`, `Heading`, `DataTable`/`Table`, pagination primitives, status badges where applicable. |
| Profile | `backend/src/admin/routes/settings/invoice-config/page.tsx` | Stacked editable profile fields using existing form control APIs (`Input`, `Textarea`, `Label`, `Button`) and existing container/header layout classes. |
| Addresses | `backend/src/admin/routes/settings/invoice-config/page.tsx` + `backend/src/admin/routes/digital-products/page.tsx` | Form and list hybrid using existing `Container`, field controls, and `Table` list pattern for saved entries/actions. |
| Orders | `backend/src/admin/routes/subscriptions/page.tsx` + `backend/src/admin/routes/reviews/page.tsx` | Paginated tabular data using `DataTable` API (`createDataTableColumnHelper`, `useDataTable`, `DataTable.Table`, `DataTable.Pagination`, `DataTable.Toolbar`). |
| Order details | `backend/src/admin/routes/subscriptions/[id]/page.tsx` | Detail page with heading + simple `Table` rows and link actions in cells; no custom card/table variants. |
| Return request | `backend/src/admin/routes/subscriptions/subscription-plans/page.tsx` | Action form workflow pattern using existing controls (`Input`, `Select`, `Switch`, `Button`) and side-panel form (`Drawer`) where modal workflow is needed. |
| Subscriptions | `backend/src/admin/routes/subscriptions/page.tsx` + `backend/src/admin/routes/subscriptions/[id]/page.tsx` | Subscription list/detail parity with `DataTable` list, `Badge`/`StatusBadge` statuses, row click navigation, and detail `Table`. |
| Digital products | `backend/src/admin/routes/digital-products/page.tsx` + `backend/src/admin/components/create-digital-product-form/index.tsx` | CRUD listing + create flow parity with `Container`, `Heading`, `Table`, `Table.Pagination`, `Drawer`, `Input`, `Select`, `Button`. |

## UI-block reuse enforcement checklist

Apply this checklist to every target above:

- **Form fields**: Use existing `@medusajs/ui` controls (`Input`, `Textarea`, `Select`, `Switch`, `Label`) with the same prop APIs and composition patterns already used in admin routes.
- **Buttons**: Use existing `Button` variants already present in backend routes; do not introduce new variant names or custom styling wrappers.
- **Cards / containers**: Reuse `Container` and existing border/divider utility patterns already present in admin pages.
- **Tables**: Reuse existing `Table`/`DataTable` APIs exactly (column helpers, pagination, toolbar, command bar if needed).
- **Tabs**: Reuse existing admin tab structures/components only (no new tab visual treatment).
- **Modals / drawers**: Reuse `Drawer` patterns already implemented in subscriptions plans and digital products.
- **Alerts / toasts**: Reuse existing `toast`/`Toaster` patterns from admin pages; no custom alert components.

## Hard prohibitions (parity guardrails)

- No new visual variants.
- No custom CSS files.
- No inline styles.
- No one-off utility-class combinations that are not already present in admin route patterns.
- No new layout primitives when an existing admin structure covers the use case.

If a frontend implementation cannot be completed using these existing APIs/classes, it should be considered out of parity and blocked until an exact existing backend pattern is identified and reused.

## PR traceability requirement (for implementation PRs)

Each PR must reference at least one row from the parity matrix above and include:

- frontend file/route changed
- mapped backend source file(s)
- rollout phase (`Phase 1`, `Phase 2`, or `Phase 3`)

PRs without this mapping reference are considered incomplete.

## Deviation log requirement

Any mismatch from mapped admin source behavior must be recorded in a deviation log with status:

- `open`
- `approved`
- `fixed`

Unresolved (`open`) deviations are release-blocking until explicitly approved or fixed.

## Breakpoint comparison and resolved deviations

| Frontend target | Mobile / small (<1024) | Desktop (>=1024) | Wide desktop | Deviation found | Resolution (reused existing patterns/utilities only) |
|---|---|---|---|---|---|
| Login | Single-column centered auth form | Same centered auth form | Same centered auth form | None on login width; parity already matched admin login `max-w-[280px]` | No change required |
| Signup | Single-column auth form | Same centered auth form | Same centered auth form | Signup width used `max-w-[280px]`, but mapped admin invite/create-account flow uses wider auth form shell | Updated signup form wrapper to `max-w-[360px]` to match admin invite width behavior |
| Dashboard shell + nav | Mobile account nav collapsed into compact/mobile pattern | Left nav + content split | Constrained content container | Collapse boundary needed to stay consistent with admin shell breakpoint conventions | Kept nav collapse on existing `small` (1024px) boundary and normalized account sub-layout helpers to same breakpoint family |
| Profile + addresses forms | Field groups should stack vertically | Multi-column groups where already used in admin form patterns | Same with constrained container widths | Several 2-column groups stayed 2-column on narrow widths | Converted field grids to `grid-cols-1` with `small:grid-cols-2` / `small:grid-cols-[144px_1fr]` |
| Addresses cards | Cards should stack on mobile | Two-column cards | Two-column cards in same container rhythm | Mixed breakpoint token usage (`lg:*`) instead of account/admin parity token family | Switched to `small:grid-cols-2` to align with account/admin 1024px collapse boundary |
| Orders + detail tables | Table content should remain usable with horizontal overflow when needed | Standard table layout | Standard table layout | Order-items table lacked explicit overflow guard | Wrapped table in existing utility `overflow-x-auto` container |
| Return / transfer forms | Single-column fields/actions | Two-column where applicable | Two-column where applicable | Transfer form used `sm:*` (640px) instead of account/admin 1024 behavior | Updated to `small:grid-cols-2` to align collapse/expansion behavior with admin parity boundary |
| Address modals | Modal body fields should stack and remain scroll-safe on narrow widths | Multi-column field groups in available width | Same modal sizing | Modal field grids forced two columns at small widths | Updated modal field groups to mobile-first stacking with existing `small:*` utilities (no new styles) |
