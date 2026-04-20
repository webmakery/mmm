# AGENTS.md

## RULE 0 (highest priority)

Preserve brand consistency and strictly reuse the existing design system.

Project locations:

* Frontend UI: `/frontend`
* Backend UI: `/backend`

This rule applies to both.

Do not treat any task as a redesign unless explicitly requested.

---

## RULE 1 — NEVER

* Never introduce a visual style that conflicts with the existing product brand
* Never change or override global fonts, font families, font sizes, font weights, line heights, letter spacing, spacing scales, colors, radii, borders, shadows, or other core visual foundations unless explicitly requested
* Never create a custom typography style that differs from the global typography system
* Never introduce a new visual token unless there is no suitable existing token and it is explicitly needed to support a reusable design need
* Never use inline styles
* Never add one-off CSS, local style hacks, or visual overrides that bypass the design system
* Never redesign existing product areas for personal preference
* Never create page-specific styling that breaks consistency with the rest of the product

If it looks off-brand, inconsistent, or not based on the existing system, it is wrong.

---

## RULE 2 — TYPOGRAPHY AND FOUNDATIONS ARE LOCKED

Typography and core foundations must remain identical to the global system.

This includes, without exception:

* font family
* font size
* font weight
* line height
* letter spacing
* text transform
* spacing scale
* border radius
* color palette
* shadows
* stroke and border treatments

Rules:

* Always use the existing global typography tokens and text styles
* Never define new font sizes or typography rules locally
* Never approximate existing typography with custom values
* Never “visually match” by eye when a real token or shared style already exists
* If a design needs a heading, body, label, caption, or helper style, use the closest existing global text style
* If no suitable typography token exists, stop and treat that as a system decision, not a local implementation choice

Typography consistency is mandatory, not optional.

---

## RULE 3 — COMPONENTS

* Always reuse existing components first
* Prefer extending existing compositions before creating anything new
* New components, variants, design elements, or tokens are allowed only when no suitable reusable option exists and the task clearly benefits from them

If a new component, variant, element, or token is required:

* It must reuse existing tokens, styles, utilities, and patterns as much as possible
* It must feel native to the existing product
* It must not introduce a separate visual language
* It must be reusable, not one-off
* It must not modify or conflict with global typography or foundational tokens
* It must be additive to the design system, not a local workaround

New is allowed only if it still looks like the same product and respects the existing foundations.

---

## RULE 4 — FRONTEND VS BACKEND

### `/backend`
* Prioritize strict consistency
* Reuse existing admin/application patterns closely
* Avoid introducing promotional, decorative, or expressive UI unless already established in backend
* Treat backend as system-first, not creativity-first

### `/frontend`
* Reuse existing brand styling, tokens, and components
* New compositions are allowed only when they improve clarity, hierarchy, trust, comprehension, or conversion
* New design elements may be introduced only if they are built from or aligned with the existing design system
* Typography and foundational visual rules must still remain identical to the global system

Allowed when appropriate and on-brand:

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

These must still use the existing design system and match brand styling.

---

## RULE 5 — ALWAYS

Before writing UI code:

1. Identify whether the change is in `/frontend` or `/backend`
2. Find the most similar existing UI in that area
3. Reuse the same components, tokens, typography, and styling wherever possible
4. Confirm that fonts, font sizes, and spacing match the global system exactly
5. Modify only what is necessary
6. If the page is conversion-critical, improve clarity, hierarchy, scannability, and trust using only brand-consistent system-based design

Never start visually from scratch when an existing pattern can be reused.

---

## RULE 6 — STYLING

* Only use the existing design system, tokens, utilities, and shared styles
* Prefer existing layouts and spacing patterns first
* New layout compositions are allowed in `/frontend` when needed for marketing or conversion pages
* New design tokens are allowed only when there is no existing system-supported alternative and the token is reusable, necessary, and consistent with the brand
* No one-off CSS unless there is no system-supported alternative and the result still matches the brand
* No arbitrary visual deviations
* Decorative elements are allowed only if they support comprehension, hierarchy, trust, or conversion and remain on-brand
* All styling decisions must inherit from the established global system

If the same result can be achieved with existing tokens, patterns, or components, use them.

---

## RULE 7 — CONVERSION PAGES

For landing pages, pricing pages, feature pages, comparison pages, and other conversion-focused frontend surfaces:

* Do not default to flat, text-heavy layouts if a richer composition would improve comprehension or conversion
* Use visual hierarchy appropriate for scanning
* Use imagery, icons, supporting visuals, and structured content when helpful
* Preserve the brand’s tone and visual identity
* Favor reusable section patterns over page-specific hacks
* Use stronger composition only within the boundaries of the existing design system
* Do not change typography or visual foundations to make a page feel “more designed”

The goal is high-converting UI that still feels like the same product.

---

## RULE 8 — TEXT

* Use user-facing labels only
* Never show internal keys (e.g. `app.users.title`)
* Match existing wording and tone in the product
* For frontend conversion pages, prefer concise, benefit-led, user-friendly copy structure

---

## RULE 9 — VALIDATION

Fail the task if ANY is true:

* UI feels off-brand
* UI introduces a conflicting visual language
* New styles bypass the design system
* Typography differs from the global system
* Font family, font size, font weight, line height, or spacing breaks the established system
* A new component, element, or token is one-off and not reusable
* Internal labels are visible
* The page became text-heavy or visually weak when the task required a conversion-oriented experience
* The solution ignored existing reusable assets, patterns, components, or typography
* A local style was introduced where a global token or shared pattern should have been used

---

## FINAL RULE

This is not a freeform redesign task.

Reuse the design system.
Match the brand.
Keep typography and core visual foundations identical to the global system.
Only introduce new design elements, components, compositions, or tokens when they are necessary, reusable, and still feel native to the product.
