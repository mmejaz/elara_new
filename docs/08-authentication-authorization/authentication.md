# Authentication

> **Status:** Current · **Last updated:** 2026-08-13 · **Owner:** Engineering

**Authentication = who is the user?** Elara uses **Laravel Sanctum cookie/session
auth** for the SPA — not API tokens.

## Flow

```mermaid
sequenceDiagram
    participant SPA
    participant API
    SPA->>API: GET /sanctum/csrf-cookie
    API-->>SPA: Set-Cookie XSRF-TOKEN + session
    SPA->>API: POST /api/login {email, password} (X-XSRF-TOKEN)
    API->>API: (tenant resolved by domain) Auth::attempt against that DB's users
    API-->>SPA: 200 + user payload; session cookie authenticates further calls
    SPA->>API: GET /api/user  (cookie sent automatically)
    API-->>SPA: current user + roles + permissions
```

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| GET | `/sanctum/csrf-cookie` | Issue CSRF + session cookie (call first) |
| POST | `/api/login` | Authenticate; starts session |
| POST | `/api/logout` | Invalidate session |
| GET | `/api/user` | Current user + roles + permissions |

Login is handled by `AuthController`, which regenerates the session on success.
On logout the session is invalidated and the CSRF token regenerated.

## Which database authenticates?

Because tenancy is resolved **before** auth, `Auth::attempt` runs against the
**active context's** `users` table:

- Request to a **tenant** domain (`localhost`) → the tenant DB's users.
- Request to the **central** domain (`127.0.0.1`) → the central DB's users.

A user in one tenant is unrelated to a user in another (separate databases).

## Client side

- `services/apiClient.ts` (axios): `withCredentials: true`, XSRF header enabled.
- `store/authSlice.ts`: `login`, `logout`, `fetchUser` thunks.
- `components/AuthGuard.tsx`: gates the admin layout, redirects to `/login` when
  unauthenticated.

## Stateful domains (the gotcha)

Sanctum only starts a session for origins listed in
`SANCTUM_STATEFUL_DOMAINS` (currently `localhost:5173`, `*.localhost:5173`). A
login from a non-listed origin throws **"Session store not set on request"**. See
[../setup/environment.md](../setup/environment.md).

## Not currently implemented

- **Registration** — no public sign-up; users are seeded/created by admins.
- **Password reset** — the `password_reset_tokens` table exists (Laravel default)
  but no reset flow is wired into the SPA. *Recommendation: add if self-service
  reset is needed.*
- **API-token auth** — `personal_access_tokens` exists but the SPA uses cookies.
