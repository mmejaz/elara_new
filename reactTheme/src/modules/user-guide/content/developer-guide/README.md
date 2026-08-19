# Elara — Project Documentation

Elara is a **multi-tenant SaaS admin platform**: a single Laravel + React codebase
that serves a central management app and any number of isolated customer
workspaces (tenants), each with its **own database**.

- **Backend:** Laravel 13 · PHP 8.4 · Sanctum (cookie auth) · spatie/laravel-permission · Stancl Tenancy v3 (database-per-tenant) · MySQL 8
- **Frontend:** React 19 · TypeScript · Vite · Ant Design 6 · TanStack Query · TanStack Router · Redux Toolkit · Tailwind 4
- **Infra:** Docker Compose (backend, frontend, nginx, MySQL, phpMyAdmin)

## Documentation map

| Area | Docs |
|---|---|
| **Architecture** | [overview](architecture/overview.md) · [backend](architecture/backend.md) · [frontend](architecture/frontend.md) · [database](architecture/database.md) |
| **Setup** | [local development](setup/local-development.md) · [environment](setup/environment.md) · [troubleshooting](setup/troubleshooting.md) |
| **Development** | [coding standards](development/coding-standards.md) · [git workflow](development/git-workflow.md) · [adding a module](development/adding-module.md) |
| **API** | [authentication](api/authentication.md) · [users](api/users.md) · [employees](api/employees.md) |
| **Modules** | [user management](modules/user-management.md) · [attendance](modules/attendance.md) · [leave](modules/leave.md) · [payroll](modules/payroll.md) |
| **Deployment** | [staging](deployment/staging.md) · [production](deployment/production.md) · [rollback](deployment/rollback.md) |
| **Troubleshooting** | [common issues](troubleshooting/common-issues.md) |

## Repository layout

```
elara_new/
├── back/               # Laravel API (the whole backend)
├── reactTheme/         # React SPA (the whole frontend, separate build)
├── docker/             # nginx config, MySQL init
├── docker-compose.yml  # backend, frontend, nginx, db, phpmyadmin
└── docs/               # this documentation
```

## Quick start

```bash
docker compose up -d --build
docker compose exec backend composer install
docker compose exec backend php artisan key:generate
docker compose exec backend php artisan migrate:fresh --seed
```

Then open **http://localhost:5173** and sign in with the seeded admin
(`test@test.com` / `password123`). Full detail in
[setup/local-development.md](setup/local-development.md).

## Status legend used in these docs

Some sections describe features that are **planned but not yet implemented**.
They are marked clearly:

- ✅ **Implemented** — working code you can rely on.
- 🚧 **Planned** — documented for the roadmap; no backend/frontend yet.
