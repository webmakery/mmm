# AGENTS.md

## RULE 0 (highest priority)

Reuse existing UI. Do not create new UI.

---

## RULE 1 — NEVER

* Never create new styles
* Never create new components
* Never create new layout patterns
* Never change fonts, spacing, colors, radii, shadows
* Never use inline styles
* Never “improve” or redesign UI

If it looks different → it is wrong

---

## RULE 2 — ALWAYS

* Always reuse existing components
* Always reuse existing layouts
* Always reuse existing styling (tokens, classes, patterns)
* Always match nearby UI exactly (frontend or backend)

---

## RULE 3 — WORKFLOW (required)

Before coding:

1. Find similar UI in the codebase
2. Copy its structure
3. Reuse its components
4. Modify only content/data

Never start from scratch

---

## RULE 4 — STYLING

* Only use existing design system
* No new CSS
* No overrides
* No new variants

---

## RULE 5 — TEXT

* Use user-facing labels only
* Never show internal keys (e.g. `app.users.title`)
* Match existing wording

---

## RULE 6 — VALIDATION

Fail the task if ANY is true:

* UI looks new
* UI looks different from existing product
* New styles or components were introduced
* Spacing/typography does not match
* Internal labels are visible

---

## FINAL

Not a design task.

Reuse. Copy. Match exactly.
