# Frontend Security

> **Status:** Current · **Last updated:** 2026-08-19 · **Owner:** Engineering

The SPA's security properties. The golden rule: **the browser is untrusted — the
client never holds a secret and never makes an access decision.** All enforcement
is server-side (see [backend.md](backend.md)).

## Implemented

| Area | Mechanism |
|---|---|
| Token theft resistance | **No token in JS.** Auth is an httpOnly Sanctum session cookie the JS can't read — XSS can't exfiltrate it |
| No auth persistence | Auth state lives only in memory (Redux); it's **not** written to `localStorage`. Each load re-derives identity from the cookie via `GET /api/user` |
| CSRF participation | axios `withCredentials` + `withXSRFToken` sends `X-XSRF-TOKEN` from the `XSRF-TOKEN` cookie on every mutation |
| XSS defense | React escapes all interpolated values; the app uses **no** `dangerouslySetInnerHTML` |
| Markdown/diagram sandboxing | The User Guide renders markdown with react-markdown (no raw-HTML plugin) and Mermaid with `securityLevel: 'strict'`; invalid diagrams fall back to `textContent`, never injected HTML |
| Session-loss cleanup | The `401` response interceptor clears cached data so a revoked session leaves nothing stale on screen |

## What the frontend does **not** do (by design)

- **It does not authorize.** Buttons and nav are not hidden by permission today;
  the backend's `403` is the only boundary. Never rely on the UI concealing
  something for safety — see
  [../08-authentication-authorization/authorization-frontend.md](../08-authentication-authorization/authorization-frontend.md).
- **It holds no secrets.** `VITE_*` env vars are **baked into the public bundle**
  and readable by anyone. Only non-sensitive config belongs there
  (`VITE_API_BASE_URL`, `VITE_BACKEND_URL`). Never put an API key or secret in a
  `VITE_` variable.

## What's in `localStorage` (all non-sensitive)

- UI preferences (theme, layout) and the selected organization id.
- A cached copy of the sidebar module tree (nav metadata only).

No credentials, tokens, or personal data are persisted.

## Known risks / hardening recommendations

> Recommendations, not current behavior.

- **No Content-Security-Policy on the SPA.** A CSP (script-src/style-src) in
  production would harden against injected scripts. Not set today.
- **Security headers cover API responses, not the static SPA origin.** The
  backend `SecurityHeaders` middleware protects API responses; in production the
  server that serves the built SPA (nginx) should send the same headers
  (`X-Frame-Options`, `X-Content-Type-Options`, HSTS, CSP).
- **Add client-side permission gating** for UX (hide unusable actions) — the
  permission data is already in Redux, just unused. This is a UX improvement, not
  a security control; the server stays the boundary.

## Not implemented

- CSP, Subresource Integrity, and any client-side 2FA UI — none present.
