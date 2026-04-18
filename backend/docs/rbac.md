# Team RBAC

This repository now includes a Medusa module for admin team role-based access control.

## What is included

- `team_role` and `team_user_role` models in `src/modules/team-rbac`.
- Default roles seeded automatically:
  - `super_admin`
  - `admin`
  - `editor`
  - `viewer`
- Admin APIs:
  - `GET /admin/rbac/roles`
  - `POST /admin/rbac/roles`
  - `POST /admin/rbac/roles/:id`
  - `DELETE /admin/rbac/roles/:id`
  - `GET /admin/rbac/team`
  - `POST /admin/rbac/team/invites`
  - `POST /admin/rbac/team/:user_id/roles`
  - `DELETE /admin/rbac/team/:user_id/roles/:role_id`
  - `GET /admin/rbac/me/permissions`
- Admin UI pages:
  - Settings → Team
  - Settings → Roles

## Security safeguards

- Permission guard helper with `super_admin` bypass.
- Non-super-admin users cannot assign `super_admin`.
- Last `super_admin` cannot be removed.
- Users cannot remove their own `super_admin` role.
- Users cannot remove their own team management permission via role reassignment.

## Invite flow

Invites are created through Medusa's invite workflow (`createInvitesWorkflow`) and role keys are attached to invites so accepted users receive the role assignments.

