# Frontend Technology Stack

> **Status:** Current · **Last updated:** 2026-08-19 · **Owner:** Engineering

Exact versions from `reactTheme/package.json`. (Backend counterpart:
[backend.md](backend.md).)

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

## Runtime

The SPA runs in its own Docker container (Vite dev server) during development;
in production it builds to static assets served behind nginx. See
[backend.md](backend.md#infrastructure) for the full container topology.

> **Server state vs client state** — `@tanstack/react-query` and
> `@reduxjs/toolkit` are both present by design, each owning a different kind of
> state. See
> [../design-patterns/frontend.md](../design-patterns/frontend.md) for the rule.
