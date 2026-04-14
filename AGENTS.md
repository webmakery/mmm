# AGENTS.md

## RULE 0 (highest priority)

Reuse existing UI. Do not create new UI.

Project locations:

* Frontend UI: `/frontend`
* Backend UI: `/backend`

This rule applies to both.

---

## RULE 1 — NEVER

* Never create new styles
* Never create new layout patterns
* Never change fonts, spacing, colors, radii, shadows, or visual tokens
* Never use inline styles
* Never add one-off CSS or local visual overrides
* Never redesign or “improve” the UI visually

If it looks different from the existing product, it is wrong.

---

## RULE 2 — COMPONENTS (strict)

* Always reuse existing components

* Never create new components or variants
  UNLESS no reusable component exists

* If a new component is absolutely required:

  * It must match existing UI exactly
  * It must reuse existing tokens, styles, and patterns
  * It must not introduce any new visual style

If the new component looks new → it is wrong

---

## RULE 3 — ALWAYS

* Always reuse existing layouts
* Always reuse existing styling, tokens, classes, and patterns
* Always match nearby UI exactly
* Always follow the established UI in `/frontend` or `/backend`

---

## RULE 4 — REQUIRED WORKFLOW

Before writing any UI code:

1. Identify if the change is in `/frontend` or `/backend`
2. Find the most similar existing UI in that area
3. Copy the structure and pattern
4. Reuse the same components and styling
5. Modify only what is necessary

Never start from scratch.

If unsure → copy an existing screen.

---

## RULE 5 — STYLING

* Only use existing design system
* Only use existing tokens, utilities, and shared styles
* No new CSS unless an identical pattern already exists
* No new variants
* No visual deviations

---

## RULE 6 — TEXT

* Use user-facing labels only
* Never show internal keys (e.g. `app.users.title`)
* Match existing wording in the product

---

## RULE 7 — VALIDATION

Fail the task if ANY is true:

* UI looks new
* UI looks different from existing `/frontend` or `/backend`
* New styles or patterns were introduced
* Typography or spacing does not match
* A new component introduces visual differences
* Internal labels are visible

---

## FINAL RULE

This is not a design task.

Reuse. Copy. Match exactly.
