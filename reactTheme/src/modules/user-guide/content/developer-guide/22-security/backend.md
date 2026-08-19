# Backend Security

> **Status:** Current · **Last updated:** 2026-08-19 · **Owner:** Engineering

Server-side security posture. (Frontend counterpart:
[frontend.md](frontend.md).)

## Implemented

| Area | Mechanism |
|---|---|
| Authentication | Sanctum cookie/session; passwords hashed via the model `hashed` cast |
| CSRF | Sanctum XSRF cookie + `X-XSRF-TOKEN` header required on mutations |
| Authorization | spatie roles/permissions (both guards) + FormRequest `authorize()`; Super Admin bypass |
| Tenant isolation | Separate database per tenant; enforced + covered by isolation tests |
| Session isolation | Host-only cookies (`SESSION_DOMAIN` empty) + per-tenant sessions + `EnsureUserBelongsToTenant` |
| Rate limiting | Global `throttleApi()` on all `/api`; stricter per-email/IP limiter on login |
| Security headers | `App\Http\Middleware\SecurityHeaders` on every response (see below) |
| SQL injection | Eloquent/parameter binding throughout; the tenant **id** is charset-locked (`[a-z0-9_]`) so it can't inject into `CREATE DATABASE` |
| Central/tenant boundary | `central` middleware keeps tenant-management/module-builder off tenant domains |
| Tenant admin password | `ClearTenantAdminPassword` job wipes the plaintext admin password from the tenant's `data` after provisioning; never exposed by `TenantResource` |
| Stack fingerprinting | `X-Powered-By` stripped from responses |

## Security headers (`SecurityHeaders` middleware)

Added to every response as cheap defense-in-depth:

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | No MIME-sniffing into executables |
| `X-Frame-Options` | `DENY` | Anti-clickjacking (the API is never framed) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Don't leak id-carrying URLs cross-origin |
| `X-XSS-Protection` | `0` | Disable the deprecated auditor (current OWASP guidance) |
| `Permissions-Policy` | `geolocation=(), camera=(), microphone=(), payment=()` | Drop unused browser features |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS only — omitted on plain HTTP |

## Known risks / hardening recommendations

> These are **recommendations**, not current behavior.

- **Local dev connects as MySQL `root`** (needed so provisioning can `CREATE
  DATABASE`). *Production: a dedicated, minimally-scoped provisioning user, and a
  separate low-privilege user for request traffic.*
- **Tenant admin password is stored briefly in plaintext** in the tenant `data`
  JSON for the seeder, then cleared by a job. *Prefer a random password + forced
  reset, or clearing synchronously.*
- **No DB-level unique constraints on lookup `name` columns** — uniqueness is
  app-layer only. *Add `unique(name)` for defence in depth.*
- **CORS/stateful domains** are localhost-scoped; when adding real tenant domains,
  update `SANCTUM_STATEFUL_DOMAINS` / CORS patterns carefully (credentials are
  sent). Never widen to a bare wildcard with credentials.
- **HTTPS** is not configured locally; production must terminate TLS (wildcard
  cert for tenant subdomains).

## Secrets

Never commit real secrets. `back/.env` holds credentials; use placeholders in
docs (`YOUR_DB_PASSWORD`, `YOUR_APP_KEY`). Rotate `APP_KEY` per environment.

## Not currently implemented

- Two-factor auth, audit logging, and WAF/IDS integration — none present.
