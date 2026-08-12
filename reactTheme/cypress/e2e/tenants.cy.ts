/**
 * Complete tenant-module lifecycle against the running stack.
 *
 * Tenants are a central-only, Super-Admin feature (see routes/modules/TenantApi):
 * provision → suspend → reactivate → delete (delete drops the tenant database).
 * The seeded central admin (test@test.com) holds the Super Admin role, so
 * cy.login() alone is enough authorisation.
 *
 * Prerequisites:
 *   - Frontend :5173 and backend :8000 up, DB seeded.
 *   - The queue worker running (docker service `elara_queue`) so the tenant DB
 *     actually gets provisioned. The central record — and therefore every
 *     assertion below — appears immediately regardless, since status lives in
 *     the central `data` column, not the tenant DB.
 */
describe('Tenant module', () => {
  beforeEach(() => {
    // Central Super Admin, cached via cy.session (see commands.ts).
    cy.login()
  })

  it('lists tenants on the central host', () => {
    cy.visit('/tenants')
    cy.contains('Provision and manage tenant workspaces').should('be.visible')
    cy.contains('button', 'Create Tenant').should('be.visible')
    cy.get('input[placeholder^="Search tenants"]').should('exist')
    cy.get('.ant-table').should('exist')
  })

  it('provisions, suspends, reactivates, and deletes a tenant end to end', () => {
    // Sweep any orphan left by a prior failed run so we start clean.
    cy.deleteTenantsByPrefix('cyp')

    // Unique per run so re-runs never collide on the domain/id unique keys.
    const ts = Date.now()
    const token = `cyp${ts}`
    const name = `Cypress Tenant ${ts}`
    const domain = `${token}.elara.test`

    cy.visit('/tenants')

    // ── create ──────────────────────────────────────────────────────────────
    cy.contains('button', 'Create Tenant').click()
    // force: the drawer is position:fixed and slides in — Cypress's visibility
    // check on fixed ancestors intermittently reports the fields as "overflowed"
    // mid-animation. We've already asserted the drawer is open, so typing into
    // its known inputs directly is safe.
    cy.get('.ant-drawer')
      .should('be.visible')
      .within(() => {
        cy.get('input[placeholder="e.g. School One"]').type(name, { force: true })
        cy.get('input[placeholder="school1.elara.test"]').type(domain, { force: true })
        cy.get('input[placeholder="admin@school1.test"]').type(`admin@${token}.test`, {
          force: true,
        })
        // Unique, so never in a breach list if Password::defaults() is strict.
        cy.get('input[placeholder="At least 8 characters"]').type(`Cyp!${ts}aZ`, {
          force: true,
          log: false,
        })
        // Footer button (lowercase 't'); timezone/currency/language default in.
        cy.contains('button', 'Create tenant').click()
      })

    // Success signal: the drawer content is torn down (destroyOnHidden) and a
    // notification is raised. (The .ant-drawer root itself lingers in the DOM,
    // so assert on the content wrapper, not the root.)
    cy.get('.ant-drawer-content').should('not.exist')
    cy.contains('Tenant created').should('be.visible')

    // ── appears in the list ─────────────────────────────────────────────────
    // The table defaults to created_at DESC, so the just-created tenant is the
    // top row on page 1 — find it by its unique name directly. (Deliberately no
    // search box: typing into the debounced, controlled input races the
    // post-create refetch and drops characters.) A fresh row() query each time
    // re-runs after every table refetch, so we never hold a detached element.
    const row = () => cy.contains('tr', name, { timeout: 15_000 })
    // The Status column can be scrolled out of view horizontally, so assert the
    // tag exists rather than is-visible. Domain tags never contain these words.
    row().contains('.ant-tag', 'active').should('exist')

    // ── suspend ─────────────────────────────────────────────────────────────
    // Active rows show the pause icon (click → suspend). Actions are a sticky
    // right column, so the icon is always reachable regardless of scroll.
    row().find('.anticon-pause-circle').click()
    row().contains('.ant-tag', 'suspended', { timeout: 15_000 }).should('exist')

    // ── reactivate ──────────────────────────────────────────────────────────
    // Suspended rows show the play icon (click → activate).
    row().find('.anticon-play-circle').click()
    row().contains('.ant-tag', 'active', { timeout: 15_000 }).should('exist')

    // ── delete (drops the tenant database) ──────────────────────────────────
    // Provisioning is queued (~seconds) but DeleteDatabase runs synchronously, so
    // dropping before the DB exists 500s. Wait for it to be provisioned first.
    cy.waitForTenantProvisioned(token)
    row().find('.anticon-delete').click()
    cy.get('.ant-popconfirm').should('be.visible').contains('button', 'Delete').click()
    cy.contains(/tenant deleted/i).should('be.visible')
    cy.contains('tr', name).should('not.exist')
  })
})
