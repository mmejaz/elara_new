# Module Builder

> **Where:** Management → Module Builder
> **Note:** available on the central (main) site only, and typically for
> administrators.

The Module Builder lets you add a **new module** to the app without writing code.
You can create a simple menu group, or a full data screen with its own list and
create/edit form.

## What you can do

- Add a new **menu item** or **group** to the sidebar.
- Create a **data module** — a new screen that manages its own records, complete
  with the standard list, search, and create/edit panel.

## How to create a module

1. Open **Management → Module Builder**.
2. Select **Add** and fill in:
   - **Name** — what appears in the sidebar.
   - **Icon** — pick from the icon list.
   - **Parent** — the group it belongs under (optional).
   - **Type** — a plain menu item/group, or a full **data module**.
3. Save. A data module is generated and becomes available in the sidebar, with
   its own permissions created automatically.

## After creating

- Set who can use it by adding its permissions to a **role** — see
  [Roles & Permissions](roles-and-permissions.md).
- Control its sidebar visibility from [Managed Modules](managed-modules.md).

## Tips

- Names drive the new screen's address and permissions, so choose carefully.
- If you only need to hide/show existing screens, use
  [Managed Modules](managed-modules.md) — you don't need the builder.
