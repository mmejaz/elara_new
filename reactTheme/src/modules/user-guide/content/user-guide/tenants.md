# Tenants

> **Where:** Management → Tenants
> **Note:** available on the central (main) site only, and restricted to
> **Super Admin**.

A **tenant** is a separate, self-contained workspace with its own users and data,
reached on its own web address. This screen is where an operator creates and
manages those workspaces.

## What you can do

- See all tenants and their status.
- Create a new tenant (which sets up its own database and starter data).
- **Activate** or **suspend** a tenant.
- Delete a tenant.

## Create a tenant

1. Open **Management → Tenants** and select **Add Tenant**.
2. Provide the tenant's **name**, its **web address (domain)**, and the details
   for its **first administrator** (who will sign in to that workspace).
3. Save. The workspace is prepared in the background — its database is created,
   set up, and seeded with starter data. This can take a moment.

## Manage a tenant

- **Suspend** to temporarily block access; **Activate** to restore it.
- **Delete** to remove the workspace. This is permanent — its data goes with it.

## Tips

- Each tenant is fully isolated: users and data in one tenant are invisible to
  another.
- The first administrator's password is used only to set up their account — share
  it securely and have them change it on first sign-in via
  [Profile → Security](profile.md).
