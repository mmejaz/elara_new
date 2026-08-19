# Roles & Permissions

> **Where:** Management → Roles, and Management → Permissions

Access is controlled with **roles** and **permissions**:

- A **permission** is a single thing you're allowed to do, named
  `module.action` — for example `users.create` or `organization.view`.
- A **role** is a named bundle of permissions — for example *Admin* or *Teacher*.
- You give a **user** access by assigning them a **role** (see
  [Managing Users](users.md)).

```
Permission  →  grouped into a  →  Role  →  assigned to a  →  User
```

## Roles

**Where:** Management → Roles

- **See all roles** in the list.
- **Add a role:** select **Add Role**, give it a **name**, then **tick the
  permissions** it should include using the permission picker. Select **Save**.
- **Edit a role:** open it, adjust its name or ticked permissions, and **Save**.
  Everyone with that role is affected immediately.

### Built-in roles

- **Super Admin** — full access to everything (bypasses individual permission
  checks). For platform owners/administrators only.
- **Admin** — granted every permission; the everyday administrator role.
- **Teacher / Student / Parent** — starter roles for the education context with
  limited permissions.

## Permissions

**Where:** Management → Permissions

Browse the full list of permissions. Most are created automatically for each
module (a `view`, `create`, `edit`, and `delete` for every feature), so you
normally **assign** permissions via roles rather than creating them by hand.

## How to give someone access — the usual flow

1. Decide which **role** fits what they should do (or create/adjust one).
2. Go to [Users](users.md), open the person, and **assign that role**.
3. They can confirm what they now have under **Profile → Access**.

> Blocked with an "unauthorized" message? Your role is missing that permission.
> An administrator can add it to your role here.
