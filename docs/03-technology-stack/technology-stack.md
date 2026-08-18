# Technology Stack

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

Exact versions from `back/composer.json` and `reactTheme/package.json`.

## Backend

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Language | PHP | ^8.3 (runs 8.4) | Backend runtime |
| Framework | Laravel | ^13.8 | API framework |
| Auth | Laravel Sanctum | ^4.0 | Cookie/session SPA auth |
| Authorization | spatie/laravel-permission | ^8.1 | Roles & permissions |
| Multi-tenancy | stancl/tenancy | ^3.10 | Database-per-tenant |
| AI/agents | laravel/mcp, laravel/ai | * | Installed; wiring in progress |
| REPL | laravel/tinker | ^3.0 | Console |
| Style | laravel/pint (dev) | ^1.27 | PSR-12 formatting |
| Tests | phpunit/phpunit (dev) | ^12.5 | Feature/unit tests |
| Fakes | fakerphp/faker (dev) | ^1.23 | Factories |
| Database | MySQL | 8.0 | Central + per-tenant DBs |

## Frontend

| Component | Technology | Version | Purpose |
|---|---|---|---|
| Language | TypeScript | ^6.0 | Typed React |
| UI runtime | React | ^19.2 | SPA |
| Build tool | Vite | ^8.0 | Dev server + bundler |
| UI kit | Ant Design | ^6.4 | Components |
| Icons/Charts | @ant-design/icons, @ant-design/charts | ^6.1 / ^2.6 | Iconography, charts |
| Styling | Tailwind CSS | ^4.3 | Utility CSS |
| Server state | @tanstack/react-query | ^5.10 | Data fetching/caching |
| Routing | @tanstack/react-router | ^1.17 | Route tree |
| Client state | @reduxjs/toolkit + react-redux | ^2.12 / ^9.3 | UI state |
| HTTP | axios | ^1.17 | API calls (cookie + XSRF) |
| Dates | dayjs | ^1.11 | Date handling |
| Unit tests | Vitest + Testing Library | ^4.1 | Component/unit tests |
| E2E | Cypress | ^15.20 | End-to-end |

## Infrastructure

| Component | Technology | Purpose |
|---|---|---|
| Containers | Docker Compose | backend, frontend, nginx, db, phpmyadmin |
| Web server | nginx (alpine) | Reverse proxy → php-fpm; port 8000 |
| DB admin | phpMyAdmin | port 8080 |
| Session/Cache/Queue | database driver (MySQL) | No Redis in use |

## Not currently used

- **Redis** — `SESSION`/`CACHE`/`QUEUE` all use the `database` driver.
- **CI/CD** — no `.github` or pipeline files.
- **Notifications / mail delivery** — mail driver is `log` (no real sending).
