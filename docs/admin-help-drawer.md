# Admin Help / Ask Drawer

## Overview

This adds a reusable right-side **Help / Ask Webhost** drawer for the admin panel with a config-driven route matcher.

- Opens in a drawer from the right side.
- Does not navigate away from the current page.
- Supports **Help** and **Ask** tabs.
- Uses route-aware topic matching.
- Includes seeded onboarding/help content for:
  - dashboard
  - products
  - add/edit product
  - orders
  - settings
- Adds **Guide me** CTA in empty/fallback help states.

## File structure

- `backend/src/admin/lib/admin-help-drawer-content.ts`
  - Route/topic config and matcher (`findHelpTopicByPath`)
- `backend/src/admin/components/admin-help-drawer.tsx`
  - Reusable drawer UI and behavior
- `backend/src/admin/widgets/admin-help-drawer-widget.tsx`
  - Widget registration for major admin zones
- `backend/src/admin/routes/dashboard/page-content.tsx`
  - Mounts drawer on dashboard and adds Guide me CTA for dashboard-empty/error case

## Context-aware behavior

The drawer resolves route context by matching `location.pathname` against configurable regex patterns. This keeps architecture ready for future AI support by separating:

1. topic/content config (data)
2. rendering and interaction (UI)

To add future AI behavior, wire Ask-tab submit handling to an API/LLM endpoint while preserving the existing topic config.

## Accessibility and keyboard

- Drawer is built on the existing Medusa UI `Drawer` (dialog semantics and focus management).
- Keyboard shortcut: **Ctrl+H** (or **Cmd+H** on macOS) opens the drawer.
- Escape-to-close behavior is provided by the Drawer component.

## Notes

- The implementation reuses existing admin UI components (`Drawer`, `Tabs`, `Button`, `Input`, `Text`, `Heading`) and existing utility classes only.
- No new visual tokens, custom CSS files, or inline style overrides were introduced.
