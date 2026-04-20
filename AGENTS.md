# AGENTS.md

## RULE 0 (highest priority)

Preserve brand consistency and reuse the existing design system.

Project locations:

* Frontend UI: `/frontend`
* Backend UI: `/backend`

This rule applies to both.

---

## RULE 1 — NEVER

* Never introduce a visual style that conflicts with the existing product brand
* Never invent new visual tokens without necessity
* Never change global fonts, spacing scales, colors, radii, shadows, or core visual foundations unless explicitly requested
* Never use inline styles
* Never add one-off CSS or local visual overrides that bypass the design system
* Never redesign existing product areas for personal preference

If it looks off-brand or inconsistent with the existing product, it is wrong.

---

## RULE 2 — COMPONENTS

* Always reuse existing components first
* Prefer extending existing compositions before creating anything new
* New components or variants are allowed only when no suitable reusable option exists and the task clearly benefits from it

If a new component or variant is required:

* It must reuse existing tokens, styles, utilities, and patterns
* It must feel native to the existing product
* It must not introduce a separate visual language
* It must be reusable, not one-off

New is allowed only if it still looks like the same product.

---

## RULE 3 — FRONTEND VS BACKEND

### `/backend`
* Prioritize strict consistency
* Reuse existing admin/application patterns closely
* Avoid introducing promotional or decorative UI unless already established in backend

### `/frontend`
* Reuse existing brand styling, tokens, and components
* It is allowed to introduce new **compositions** and **conversion-oriented sections** when needed to improve clarity, hierarchy, trust, and conversion
* This may include, when appropriate:
  * icons
  * illustrations
  * product imagery
  * logos
  * testimonials
  * trust badges
  * stats
  * cards
  * comparison blocks
  * callout sections
  * richer hero/content layouts

These elements must still use the existing design system and match brand styling.

---

## RULE 4 — ALWAYS

Before writing UI code:

1. Identify whether the change is in `/frontend` or `/backend`
2. Find the most similar existing UI in that area
3. Reuse the same components, tokens, and styling wherever possible
4. Keep the brand language consistent
5. Modify only what is necessary
6. If the page is conversion-critical, optimize for clarity, hierarchy, scannability, and trust using brand-consistent design elements

Never start visually from scratch when an existing pattern can be reused.

---

## RULE 5 — STYLING

* Only use the existing design system, tokens, utilities, and shared styles
* Prefer existing layouts and spacing patterns first
* New layout compositions are allowed in `/frontend` when needed for marketing or conversion pages
* No one-off CSS unless there is no system-supported alternative and the result still matches the brand
* No arbitrary visual deviations
* Decorative elements are allowed only if they support comprehension, hierarchy, trust, or conversion and remain on-brand

---

## RULE 6 — CONVERSION PAGES

For landing pages, pricing pages, feature pages, comparison pages, and other conversion-focused frontend surfaces:

* Do not default to flat text-heavy layouts if a richer composition would improve comprehension or conversion
* Use visual hierarchy appropriate for scanning
* Use imagery, icons, supporting visuals, and structured content when helpful
* Preserve the brand’s tone and visual identity
* Favor reusable section patterns over page-specific hacks
* The goal is not “minimal text blocks at all costs”
* The goal is high-converting UI that still feels like the same product

---

## RULE 7 — TEXT

* Use user-facing labels only
* Never show internal keys (e.g. `app.users.title`)
* Match existing wording and tone in the product
* For frontend conversion pages, prefer concise, benefit-led, user-friendly copy structure

---

## RULE 8 — VALIDATION

Fail the task if ANY is true:

* UI feels off-brand
* UI introduces a conflicting visual language
* New styles bypass the design system
* Typography or spacing breaks the established system
* A new component is one-off and not reusable
* Internal labels are visible
* The page became text-heavy or visually weak when the task required a conversion-oriented experience
* The solution ignored existing reusable assets, patterns, or components

---

## FINAL RULE

This is not a freeform redesign task.

Reuse the design system.
Match the brand.
On frontend conversion pages, richer design elements are allowed when they improve conversion and still feel native to the product.
