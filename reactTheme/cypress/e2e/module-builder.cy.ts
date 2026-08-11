/**
 * Module Builder — the code-generator screen (central-only, Super Admin).
 *
 * IMPORTANT: a *Resourceful* module scaffolds real CRUD files into the shared
 * source tree (frontend + backend), runs a migration, and has NO delete/undo
 * endpoint. So this spec never generates one. It exercises:
 *   - the page + create drawer,
 *   - form validation and the fields that appear/disappear per type,
 *   - the live preview,
 *   - creating a Group / Section, which is a DB row only (no file generation).
 *
 * The created group is verified over the API and then hard-deleted from the DB
 * (via the `db:deleteModulesByPrefix` task), since there is no delete route.
 *
 * Prerequisites: frontend :5173 + backend :8000 up, DB seeded, docker reachable
 * on the host for cleanup.
 */
describe('Module Builder', () => {
  // Test modules are named "Cyp <letters>" → slug "cyp-<letters>". Names must be
  // letters/spaces only (backend regex) and unique, so no timestamps — random
  // letters give uniqueness within the allowed charset.
  const SLUG_PREFIX = 'cyp-'
  const randomName = () =>
    'Cyp ' +
    Array.from({ length: 8 }, () =>
      String.fromCharCode(97 + Math.floor(Math.random() * 26)),
    ).join('')

  const openDrawer = () => {
    cy.visit('/module-builder')
    cy.contains('button', 'Create Module').click()
    return cy.get('.ant-drawer').should('be.visible')
  }

  beforeEach(() => {
    cy.login()
    cy.task('db:deleteModulesByPrefix', SLUG_PREFIX) // clear any prior orphan
  })

  after(() => {
    cy.task('db:deleteModulesByPrefix', SLUG_PREFIX)
  })

  it('renders the builder page', () => {
    cy.visit('/module-builder')
    cy.contains('Generate a new module with its CRUD scaffolding').should('be.visible')
    cy.contains('button', 'Create Module').should('be.visible')
    cy.get('.ant-table').should('exist')
  })

  it('validates the name field', () => {
    openDrawer().within(() => {
      // Empty submit → required error.
      cy.contains('button', 'Generate Module').click()
      cy.contains('Enter the module name').should('be.visible')

      // Digits are rejected (letters and spaces only).
      cy.get('input[placeholder="e.g. Students"]').type('Bad123', { force: true })
      cy.contains('button', 'Generate Module').click()
      cy.contains('Only letters and spaces are allowed').should('be.visible')
    })
  })

  it('adapts the form and preview to the selected type', () => {
    openDrawer().within(() => {
      cy.get('input[placeholder="e.g. Students"]').type('Cyp Preview', { force: true })

      // Default = Menu Item + Resourceful: parent + permissions shown, preview
      // reflects CRUD. (Scope "Group / Section" to radio buttons — the preview
      // renders a tag with the same text. Assert existence, not visibility: the
      // drawer is position:fixed and taller than the viewport, which confuses
      // Cypress's is-visible check on fields below the fold.)
      cy.contains('label', 'Parent / Section').should('exist')
      cy.contains('label', 'Permissions to Generate').should('exist')
      cy.contains('.ant-tag', 'Resourceful').should('exist')

      // Switch to Parent Menu: permissions disappear.
      cy.contains('.ant-radio-button-wrapper', 'Parent Menu').click()
      cy.contains('label', 'Permissions to Generate').should('not.exist')

      // Switch type to Group / Section: parent + resourceful controls disappear.
      cy.contains('.ant-radio-button-wrapper', 'Group / Section').click()
      cy.contains('label', 'Parent / Section').should('not.exist')
      cy.contains('label', 'Menu Item Type').should('not.exist')
    })
  })

  it('creates a Group / Section (no code generation)', () => {
    const name = randomName()

    openDrawer().within(() => {
      cy.get('input[placeholder="e.g. Students"]').type(name, { force: true })
      cy.contains('.ant-radio-button-wrapper', 'Group / Section').click()
      cy.contains('button', 'Generate Module').click()
    })

    // UI success: drawer content torn down + notification raised. (Assert the
    // notification exists rather than is-visible — it's caught mid fade-in at
    // opacity:0 otherwise.)
    cy.get('.ant-drawer-content').should('not.exist')
    cy.contains('.ant-notification-notice', 'Module created', { timeout: 10_000 }).should('exist')

    // Verify persistence over the API (deterministic — avoids the debounced
    // search box). The new group must be type=group and NOT resourceful, i.e. no
    // files were generated.
    // Origin/Referer make this Node-side request look first-party so Sanctum
    // treats it as stateful and authenticates it via the session cookie;
    // without them the guard returns 401.
    const app = new URL(Cypress.config('baseUrl') as string)
    cy.request({
      url: `${Cypress.env('apiUrl')}/api/modules/paginated`,
      qs: { search: name, per_page: 50 },
      headers: { Accept: 'application/json', Origin: app.origin, Referer: `${app.origin}/` },
    }).then((res) => {
      const found = (res.body?.data ?? []).find(
        (m: { name: string }) => m.name === name,
      )
      expect(found, 'created module returned by API').to.exist
      expect(found.type).to.eq('group')
      expect(found.is_resourceful).to.eq(false)
    })
  })
})
