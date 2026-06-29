# React Theme

A modern, themeable admin dashboard template built from the `elara_2026` reference
design. UI-only for now — **authentication is intentionally not implemented**
(the login screen is a placeholder).

## Tech Stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **Ant Design v6** + **@ant-design/charts** (Column / Pie / Area)
- **Redux Toolkit** + **React Redux** — UI/theme + placeholder auth state
- **TanStack Query** (+ Devtools) — server-state layer (currently dummy data)
- **React Router v7** — lazy-loaded routes
- **Axios** — pre-configured API client (no backend wired yet)
- **dayjs**, **lucide-react** (utility libs)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
npm run preview  # preview the build
npm run lint     # eslint
```

> Set `VITE_API_BASE_URL` in a `.env` file to point the Axios client at a real API.

## Folder Structure

```
src/
  app/         App root + global providers (Redux, Query, AntD theme)
  assets/      Static assets (images, fonts)
  components/  Reusable UI: PageHeader, StatCard, Preloader, SettingsDrawer
  config/      navigation.jsx — single source for sidebar + header search
  features/    Feature modules (dashboard widgets, users CRUD + queries)
  layouts/     AdminLayout (sidebar/header/content) and AuthLayout
  pages/       Route-level screens (dashboard, analytics, users, profile, ...)
  routes/      React Router route table (lazy imports)
  services/    apiClient (Axios) + queryClient (TanStack)
  store/       Redux store, uiSlice (theme), authSlice (placeholder)
  styles/      Tailwind entry + global CSS
  utils/       color helpers (hexToRgba, theme palette)
```

## Theming

Everything re-themes from the **floating settings gear** (right edge) →
`SettingsDrawer`. It controls dark/light mode, brand color (presets + custom
picker), border radius, font family/scale, density, header height, sticky header,
and framed/full content. Settings persist to `localStorage` and feed AntD's
`ConfigProvider` tokens; Tailwind `dark:` is driven by a `.dark` class on `<html>`.

## What's left for later (Auth)

The login flow is a **placeholder**. To make it real:

1. Implement login/logout API calls in `src/services/` (or a `features/auth` module).
2. Replace `LoginPage`'s dummy `setCredentials` dispatch with a real request.
3. Add `AuthGuard` / `GuestGuard` route wrappers in `src/routes/index.jsx`.
4. Add request/response interceptors (CSRF, 401 handling) to `apiClient.js`.
5. Replace the dummy user in `authSlice.js` with the authenticated session.
```
"# reactTheme" 
