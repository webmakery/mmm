# Backend Admin Visual Baseline (Source of Truth)

## Purpose
This document defines the **exact backend-admin visual source of truth** that frontend implementation must match.

- Area: `/backend`
- UI policy: reuse existing Medusa Admin UI patterns exactly (no new visual design)

---

## 1) Source-of-truth mapping

### A. Login (auth entry)
**Primary source page**
- `backend/node_modules/@medusajs/dashboard/src/routes/login/login.tsx`
  - Component: `Login`

**Supporting auth UI pieces used by login**
- `backend/node_modules/@medusajs/dashboard/src/components/layout/public-layout/public-layout.tsx`
  - Component: `PublicLayout`
- `backend/node_modules/@medusajs/dashboard/src/components/common/logo-box/avatar-box.tsx`
  - Component: `AvatarBox` (brand/auth avatar block)
- `backend/node_modules/@medusajs/dashboard/src/components/common/form/*`
  - Components: `Form`, `Form.Field`, `Form.Control`, etc.

### B. Signup (account creation)
> In this admin stack, “signup” is implemented as **invite-based account creation**.

**Primary source page**
- `backend/node_modules/@medusajs/dashboard/src/routes/invite/invite.tsx`
  - Components: `Invite`, `CreateView`, `SuccessView`, `InvalidView`

**Related auth flow page**
- `backend/node_modules/@medusajs/dashboard/src/routes/reset-password/reset-password.tsx`
  - Component: `ResetPassword`

### C. Dashboard shell (header/sidebar/content/cards/tables/forms/modals)

#### Shell and global layout (header/sidebar/content frame)
- `backend/node_modules/@medusajs/dashboard/src/components/layout/shell/shell.tsx`
  - Components: `Shell`, `Topbar`, `NavigationBar`, `DesktopSidebarContainer`, `MobileSidebarContainer`, `Gutter`
- `backend/node_modules/@medusajs/dashboard/src/components/layout/main-layout/main-layout.tsx`
  - Components: `MainLayout`, `MainSidebar`, `Header`, `UserSection`, `CoreRouteSection`, `UtilitySection`

#### Content-page source references (cards/tables/forms/modals) in `/backend/src/admin`
These are the canonical in-repo examples to mirror visually in frontend.

- `backend/src/admin/routes/reviews/page.tsx`
  - Components/patterns: `Container`, `DataTable`, `DataTable.Toolbar`, `DataTable.Table`, `DataTable.Pagination`, `DataTable.CommandBar`, `Toaster`
- `backend/src/admin/routes/subscriptions/page.tsx`
  - Components/patterns: `Container`, `Heading`, `DataTable`, pagination list shell
- `backend/src/admin/routes/digital-products/page.tsx`
  - Components/patterns: `Container`, `Heading`, `Table`, `Table.Pagination`, `Drawer` (create flow)
- `backend/src/admin/routes/subscriptions/subscription-plans/page.tsx`
  - Components/patterns: table list + `Drawer` form (`Input`, `Select`, action `Button`s)
- `backend/src/admin/routes/settings/invoice-config/page.tsx`
  - Components/patterns: settings form layout (`Container` with section divider, field groups, submit actions)
- `backend/src/admin/components/product-builder-modal.tsx`
  - Components/patterns: modal-style builder flow, tabs, action footer
- `backend/src/admin/components/complementary-products-tab.tsx`
  - Components/patterns: embedded `DataTable` usage in tab content
- `backend/src/admin/components/addons-tab.tsx`
  - Components/patterns: embedded `DataTable` usage in tab content
- `backend/src/admin/components/custom-fields-tab.tsx`
  - Components/patterns: repeated field rows, inline actions, `Input` + `Select` form controls

---

## 2) Page/component inventory (with concrete paths)

| Domain | Page/Component | Source file |
|---|---|---|
| Login | `Login` | `backend/node_modules/@medusajs/dashboard/src/routes/login/login.tsx` |
| Signup | `Invite` / `CreateView` / `SuccessView` / `InvalidView` | `backend/node_modules/@medusajs/dashboard/src/routes/invite/invite.tsx` |
| Shell | `Shell`, `Topbar`, `NavigationBar`, `Gutter` | `backend/node_modules/@medusajs/dashboard/src/components/layout/shell/shell.tsx` |
| Sidebar/Header | `MainLayout`, `MainSidebar`, `Header` | `backend/node_modules/@medusajs/dashboard/src/components/layout/main-layout/main-layout.tsx` |
| Public auth layout | `PublicLayout` | `backend/node_modules/@medusajs/dashboard/src/components/layout/public-layout/public-layout.tsx` |
| Content cards | `Container`-based card sections | `backend/src/admin/routes/settings/invoice-config/page.tsx`, `backend/src/admin/widgets/*.tsx` |
| Data tables | `DataTable` + toolbar/table/pagination/command bar | `backend/src/admin/routes/reviews/page.tsx`, `backend/src/admin/routes/subscriptions/page.tsx` |
| Plain tables | `Table` + `Table.Pagination` | `backend/src/admin/routes/digital-products/page.tsx`, `backend/src/admin/routes/subscriptions/[id]/page.tsx` |
| Forms | `Input`, `Select`, grouped field sections, submit actions | `backend/src/admin/routes/settings/invoice-config/page.tsx`, `backend/src/admin/routes/subscriptions/subscription-plans/page.tsx`, `backend/src/admin/components/create-digital-product-form/index.tsx` |
| Modals/Drawers | `Drawer`, modal-like content patterns | `backend/src/admin/routes/digital-products/page.tsx`, `backend/src/admin/routes/subscriptions/subscription-plans/page.tsx`, `backend/src/admin/components/product-builder-modal.tsx` |
| Empty/loading/error patterns | Shell loading bar, table empty helpers, auth/server error hints | `backend/node_modules/@medusajs/dashboard/src/components/layout/shell/shell.tsx`, `backend/node_modules/@medusajs/dashboard/src/components/common/empty-table-content/empty-table-content.tsx`, `backend/node_modules/@medusajs/dashboard/src/components/utilities/error-boundary/error-boundary.tsx`, `backend/node_modules/@medusajs/dashboard/src/routes/login/login.tsx`, `backend/node_modules/@medusajs/dashboard/src/routes/invite/invite.tsx` |

---

## 3) Do-not-change visual constraints

Frontend implementations are invalid if any of the following deviate from source:

1. **Typography / fonts**
   - Preserve Medusa UI text primitives (`Heading`, `Text`, tokenized text classes).
   - No font-family, font-size, font-weight overrides.

2. **Spacing scale**
   - Keep existing spacing cadence and utility classes as-is (e.g., `p-3`, `gap-y-*`, `mb-4`, `max-w-*`).
   - No custom spacing values outside existing patterns.

3. **Radii / borders / shadows**
   - Keep existing radius/border/shadow tokens and classes (`rounded-*`, `border-*`, `shadow-*`, focus shadows).
   - Do not introduce custom border radii or bespoke elevation.

4. **Colors / states**
   - Use existing UI tokens/classes only (`bg-ui-*`, `text-ui-*`, `border-ui-*`, `focus-visible:*`).
   - Keep hover/focus/disabled/error/success styling identical to source components.

5. **Icons and icon sizing**
   - Use existing `@medusajs/icons` set and inherited sizing from current patterns.
   - No one-off icon sizes/colors.

6. **Breakpoints / responsive behavior**
   - Preserve source responsive breakpoints/behaviors (notably `lg` shell behavior, mobile sidebar toggles, table responsiveness).
   - No custom breakpoint system.

7. **Component states: empty/loading/error**
   - Empty: follow existing empty table/content components and messaging patterns.
   - Loading: preserve shell route-loading bar and component loading placeholders/skeleton patterns.
   - Error: preserve inline hints/alerts/toast patterns and placement.

8. **Forms and modals/drawers**
   - Keep control density, input heights, label/caption placement, and action-row alignment identical.
   - Reuse existing drawer/modal structures; do not invent new modal shells.

9. **No visual overrides**
   - No inline styles.
   - No new CSS modules/classes solely for visual changes.
   - No new component variants for visual differentiation.

---

## 4) Acceptance rule (blocking)

### Visual parity gate (required)
A frontend page is **rejected** if it visually deviates from its mapped backend-admin source in any of these areas:
- layout structure (shell/header/sidebar/content)
- typography
- spacing rhythm
- colors/tokens
- borders/radii/shadows
- icon style/sizing
- responsive breakpoint behavior
- empty/loading/error states
- table/form/modal/drawer composition

If there is any uncertainty, copy the closest source structure from the mapped files above and adjust only data/content wiring.

---

## 5) FE/QA baseline handoff (must happen before implementation)

Before frontend implementation begins:

1. FE lead and QA lead review this document.
2. FE maps each target frontend route to one of the source files in Sections 1–2.
3. QA derives visual test checklist directly from Section 3 constraints.
4. Work starts only after FE + QA acknowledge the mapping and rejection gate in Section 4.

**Handoff artifact:** this file (`backend/docs/admin-visual-baseline.md`).

---

## 5.1) Rollout phasing (required order)

Implementation and release scope must be split into these phases:

1. **Phase 1: Login/Signup**
   - Includes auth entry and account creation equivalents mapped in Section 1A–1B.
2. **Phase 2: Dashboard shell + core widgets**
   - Includes shell/header/sidebar/content frame and core reusable list/form widgets from Section 1C.
3. **Phase 3: Remaining dashboard pages/states**
   - Includes all remaining mapped account/dashboard routes plus required states in Sections 6–7.

No later phase may be declared complete while earlier phase parity/signoff requirements remain incomplete.

---

## 5.2) Design-adjustment policy (out of scope by default)

Design adjustments are **out of scope** for frontend parity implementation unless both conditions are met:

1. The adjustment is first applied to the mapped backend-admin source pattern.
2. The same adjustment is then mirrored in frontend targets that map to that source.

Requests to “improve” or “tweak” frontend visuals without an upstream admin-source change are rejected by default.

---

## 5.3) PR mapping traceability (required per PR)

Every implementation PR must explicitly reference the relevant **admin source mapping entry** (Section 1 or Section 2), including:

- frontend route(s) in scope
- mapped backend-admin source file(s)
- rollout phase (from Section 5.1)

PRs missing this mapping traceability are merge-blocked.

---

## 6) QA checklist (pass/fail criteria, required per mapped page + state)

Use this checklist for every mapped frontend target page, comparing against its admin source from Sections 1–2.

| # | Check | Pass criteria | Fail criteria |
|---|---|---|---|
| 1 | Reuse only existing UI | No new styles, variants, or components were introduced unless absolutely unavoidable and explicitly approved by FE + QA + Design. | Any new style/variant/component introduced without unavoidable need + explicit approval. |
| 2 | Visual token parity | Typography, spacing, colors, radii, and shadows match admin source behavior and existing tokens. | Any mismatch in type scale, spacing rhythm, color usage, borders/radius, or elevation/shadows. |
| 3 | State parity | Hover, focus, disabled, error, and loading states match admin source for equivalent controls and views. | Any state behavior or appearance differs from admin source. |
| 4 | User-visible text correctness | No internal keys are shown to users (for example translation keys like `app.users.title`). | Any internal key or non-user-facing identifier is rendered in visible UI. |

### QA verdict rule
- **PASS:** all checklist rows pass for the page/state under review.
- **FAIL (merge-blocking):** one or more checklist rows fail.

---

## 7) Side-by-side screenshot review (required evidence)

For each mapped page and required state, QA must attach side-by-side screenshots:

- Left: **Admin source** (`/backend` mapped source page/state)
- Right: **Frontend target** (`/frontend` implementation of same page/state)

Required states (when applicable to the page):
- default/resting
- hover
- focus
- disabled
- error
- loading
- empty
- populated/data-present
- responsive mobile + desktop breakpoints

If a state is not applicable, mark `N/A` with a one-line reason in the review record.

No page is considered reviewed without screenshot evidence.

---

## 7.1) Deviation log (required and release-blocking)

Maintain a living deviation log for all parity work. Each entry must include:

- mapped frontend target
- mapped backend-admin source
- deviation description
- status (`open`, `approved`, `fixed`)
- owner and target resolution date
- approval reference (required if status is `approved`)

Release is blocked if any deviation remains `open`. Before release, every deviation must be either:

1. **Explicitly approved** by FE + QA + Design, or
2. **Fixed** and re-validated through Sections 6–7 evidence.

---

## 8) Signoff requirements before release (required per page)

Each mapped page requires explicit approval from all three roles:

1. **FE signoff** (implementation parity confirmed)
2. **QA signoff** (checklist + screenshot review complete)
3. **Design signoff** (visual parity with admin source confirmed)

Release eligibility is granted only when FE + QA + Design signoffs are all present for every in-scope page.

---

## 9) Merge gate policy

Pull request merge is blocked if any of the following is true:

- Any QA checklist item in Section 6 fails for any reviewed page/state.
- Side-by-side screenshots from Section 7 are missing or incomplete.
- FE, QA, or Design signoff from Section 8 is missing for any in-scope page.

This merge gate is mandatory and overrides schedule pressure.
