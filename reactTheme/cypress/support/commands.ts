/// <reference types="cypress" />

/** Origin/Referer headers that make a cy.request (which runs from Node, so sends
 *  no Origin of its own) look like a first-party SPA call. Without them Sanctum
 *  won't treat the request as stateful and /api/login 500s with "Session store
 *  not set on request." `app` is the SPA origin, swapped to `host` for tenants. */
function spaContext(host?: string) {
  const api = new URL(Cypress.env('apiUrl'))
  const app = new URL(Cypress.config('baseUrl') as string)
  if (host) {
    api.hostname = host
    app.hostname = host
  }
  return {
    apiOrigin: api.origin,
    headers: { Origin: app.origin, Referer: `${app.origin}/`, Accept: 'application/json' },
  }
}

/**
 * Log in through the real Sanctum SPA flow (CSRF cookie → POST /api/login),
 * cached with cy.session so the actual login request runs at most once per
 * user/host and is restored from cache for every later test. That matters here:
 * /api/login is rate-limited (`throttle:login`), so re-logging-in every test
 * would trip the limiter across a run. The cached session + XSRF cookies live on
 * domain `localhost` and — because cookies ignore the port — cover both the SPA
 * (:5173) and the API (:8000), so a later cy.visit is already authenticated.
 *
 * Pass `host` (e.g. 'acme.localhost') to authenticate against a tenant.
 */
Cypress.Commands.add(
  'login',
  (email?: string, password?: string, host?: string) => {
    const { apiOrigin, headers } = spaContext(host)
    const user = email ?? Cypress.env('adminEmail')
    const pass = password ?? Cypress.env('adminPassword')

    cy.session(
      ['sanctum', user, host ?? 'central'],
      () => {
        cy.request({ url: `${apiOrigin}/sanctum/csrf-cookie`, headers })
        cy.getCookie('XSRF-TOKEN').then((cookie) => {
          cy.request({
            method: 'POST',
            url: `${apiOrigin}/api/login`,
            headers: { ...headers, 'X-XSRF-TOKEN': decodeURIComponent(cookie?.value ?? '') },
            body: { email: user, password: pass },
          })
        })
      },
      {
        // Re-run setup only if the cached session no longer authenticates.
        validate() {
          cy.request({
            url: `${apiOrigin}/api/user`,
            headers,
            failOnStatusCode: false,
          })
            .its('status')
            .should('eq', 200)
        },
        cacheAcrossSpecs: true,
      },
    )
  },
)

/**
 * Drive the actual /login form. Use this only when the login UI itself is what
 * you're testing; for setting up an authenticated state, prefer cy.login().
 */
Cypress.Commands.add('loginByForm', (email?: string, password?: string) => {
  cy.visit('/login')
  cy.get('input[placeholder="Enter your email"]').type(
    email ?? Cypress.env('adminEmail'),
  )
  cy.get('input[placeholder="Enter your password"]').type(
    password ?? Cypress.env('adminPassword'),
    { log: false },
  )
  cy.contains('button', 'Sign in').click()
})

/**
 * Delete every tenant whose id starts with `prefix`, via the central API. Keeps
 * the tenant suite idempotent: a run that fails before its own UI delete leaves
 * an orphan tenant (and database) behind, and this sweeps it on the next run.
 * Requires an authenticated session (call cy.login() first).
 */
Cypress.Commands.add('deleteTenantsByPrefix', (prefix: string) => {
  const { apiOrigin, headers } = spaContext()
  cy.getCookie('XSRF-TOKEN').then((cookie) => {
    const xsrf = decodeURIComponent(cookie?.value ?? '')
    cy.request({
      url: `${apiOrigin}/api/tenants`,
      qs: { search: prefix, per_page: 100 },
      headers,
    }).then((res) => {
      const rows = (res.body?.data ?? []) as Array<{ id: string }>
      rows
        .filter((t) => String(t.id).startsWith(prefix))
        .forEach((t) => {
          cy.request({
            method: 'DELETE',
            url: `${apiOrigin}/api/tenants/${t.id}`,
            headers: { ...headers, 'X-XSRF-TOKEN': xsrf },
            // A tenant still mid-provisioning can't be dropped yet (DeleteDatabase
            // runs synchronously); don't let a stale orphan abort the run.
            failOnStatusCode: false,
          })
        })
    })
  })
})

/**
 * Poll the central API until the tenant's database exists. Provisioning
 * (TenantCreated → CreateDatabase) is queued and takes a few seconds, but
 * deletion (TenantDeleted → DeleteDatabase) runs synchronously — so deleting
 * before the database is created makes the DROP fail with a 500. Wait for
 * `database` (tenancy_db_name) to be populated before deleting.
 */
Cypress.Commands.add(
  'waitForTenantProvisioned',
  (token: string, tries = 20) => {
    const { apiOrigin, headers } = spaContext()
    cy.request({
      url: `${apiOrigin}/api/tenants`,
      qs: { search: token, per_page: 5 },
      headers,
    }).then((res) => {
      const rows = (res.body?.data ?? []) as Array<{ id: string; database: string | null }>
      const db = rows.find((t) => String(t.id) === token)?.database
      if (db) return
      if (tries <= 0) {
        throw new Error(`Tenant ${token} was not provisioned within the timeout`)
      }
      cy.wait(1500)
      cy.waitForTenantProvisioned(token, tries - 1)
    })
  },
)

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      /** Authenticate via the Sanctum API (cached with cy.session), no UI. */
      login(email?: string, password?: string, host?: string): Chainable<void>
      /** Authenticate by filling and submitting the /login form. */
      loginByForm(email?: string, password?: string): Chainable<void>
      /** Delete all tenants whose id starts with `prefix` (test cleanup). */
      deleteTenantsByPrefix(prefix: string): Chainable<void>
      /** Poll until the tenant's database is provisioned (safe to delete). */
      waitForTenantProvisioned(token: string, tries?: number): Chainable<void>
    }
  }
}

export {}
