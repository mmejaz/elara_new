# Architecture Overview

Elara is one codebase that runs in **two contexts**, decided by the request's
domain:

- **Central app** (`127.0.0.1`) — manages tenants, organizations, and shared
  master data. Where Super Admins provision customers.
- **Tenant app** (`localhost`, and any other tenant domain) — the actual
  application a customer uses. Each tenant has an **isolated database**.

```mermaid
flowchart TB
    Browser["React SPA (Vite dev server :5173)"]
    Nginx["nginx :8000"]

    Browser -->|"cookies + XSRF"| Nginx

    subgraph Laravel["Single Laravel codebase (php-fpm)"]
      MW["InitializeTenancyIfTenantDomain<br/>(domain → tenant, or no-op on central)"]
      Central["Central context (127.0.0.1)"]
      Tenant["Tenant context (localhost, *.domain)"]
      MW --> Central
      MW --> Tenant
    end

    Nginx --> MW

    subgraph MySQL["MySQL 8"]
      CDB[("central DB: elara<br/>tenants, domains, organizations,<br/>central users/roles/modules...")]
      T1[("tenant DB: tenantlocal<br/>users, roles, modules, lookups...")]
      T2[("tenant DB: tenant<id>")]
    end

    Central --> CDB
    Tenant --> T1
    Tenant --> T2
```

## Key ideas

**Database-per-tenant (Stancl Tenancy v3).** A request's domain is resolved to a
tenant; Stancl's bootstrappers then swap Laravel's `database`, `cache`,
`filesystem`, and `queue` bindings to that tenant for the duration of the
request. Feature code (controllers, services, Eloquent) is written exactly as in
a single-tenant app — tenancy is invisible to it.

**Cookie-based SPA auth (Sanctum).** The React SPA authenticates with session
cookies + CSRF, not API tokens. The SPA and API share an origin per context.

**DB-driven navigation.** The sidebar is built from a `modules` table (not
hardcoded), served by `GET /api/modules/tree` and cached in the browser. New
modules appear by seeding a `modules` row.

**Module Builder.** A generator scaffolds a full CRUD module (migration, model,
service, controller, requests, resource, routes, and the React page/drawers/
queries) from the UI — the fastest way to add a resource.

## Request flow (tenant)

```mermaid
sequenceDiagram
    participant SPA
    participant NX as nginx
    participant TEN as Tenancy middleware
    participant AUTH as auth:sanctum
    participant C as Controller/Service
    participant DB as Tenant DB

    SPA->>NX: GET localhost:8000/api/users (cookies)
    NX->>TEN: Host = localhost
    TEN->>TEN: resolve tenant → initialize (swap DB/cache/fs)
    TEN->>AUTH: session + user read from TENANT DB
    AUTH->>C: authorized
    C->>DB: User::paginate()   (already tenant-scoped)
    DB-->>SPA: JSON (ApiResponse envelope)
```

## Where to go next

- [backend.md](backend.md) — Laravel layering, conventions, tenancy wiring.
- [frontend.md](frontend.md) — React module structure, data flow, auth.
- [database.md](database.md) — central vs tenant schema, migrations split.
