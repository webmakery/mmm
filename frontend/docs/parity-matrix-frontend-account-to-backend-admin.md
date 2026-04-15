# Frontend ↔ Backend UI Parity Matrix (Account Area)

This matrix inventories the customer account targets in `/frontend` and maps each to the closest reusable admin pattern in `/backend/src/admin`.

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
