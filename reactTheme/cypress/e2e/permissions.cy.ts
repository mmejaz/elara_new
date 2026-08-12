/**
 * Permissions page (/permissions) — Super Admin, list + create + edit.
 *
 * Permissions have no delete endpoint, so the create test uses a combination
 * that isn't seeded (module "Attendance" + action "Manage" → attendance.manage;
 * only view/create/edit/delete/export are seeded) and hard-deletes it from the
 * DB afterwards via the `db:deletePermissionByName` task. Editing a real
 * permission is not committed (would rename a live permission key), so the edit
 * test only opens the pre-filled drawer and cancels.
 *
 * Prerequisites: frontend :5173 + backend :8000 up, DB seeded, docker reachable
 * on the host for cleanup.
 */
describe('Permissions page', () => {
  const TEST_PERMISSION = 'attendance.manage'

  beforeEach(() => {
    cy.login()
  })

  after(() => {
    cy.task('db:deletePermissionByName', TEST_PERMISSION)
  })

  it('renders the page and lists permissions', () => {
    cy.visit('/permissions')
    cy.contains('Fine-grained capabilities mapped to roles').should('be.visible')
    cy.contains('button', 'Add Permission').should('be.visible')
    cy.get('.ant-table-row').should('have.length.greaterThan', 0)
  })

  it('filters the table with the search box', () => {
    cy.visit('/permissions')
    cy.get('.ant-table-row').should('have.length.greaterThan', 0)
    // Fresh page (no pending mutation), so typing into the debounced search is safe.
    cy.get('input[placeholder^="Search permissions"]').type('attendance')
    // A matching row appears and a known non-matching one drops out. (Asserting
    // the filtered set this way avoids iterating rows that the debounced refetch
    // detaches mid-loop.)
    cy.contains('.ant-table-row', 'attendance.view', { timeout: 10_000 }).should('exist')
    cy.contains('.ant-table-row', 'permissions.view').should('not.exist')
  })

  it('opens the edit drawer pre-filled for a permission', () => {
    cy.visit('/permissions')
    cy.get('input[placeholder^="Search permissions"]').type('permissions.view')
    cy.contains('.ant-table-row', 'permissions.view', { timeout: 10_000 })
      .find('.anticon-edit')
      .click()

    // Two permission drawers are mounted (Add + Edit) — scope by title.
    cy.contains('.ant-drawer', 'Edit Permission — permissions.view')
      .should('be.visible')
      .within(() => {
        cy.get('input#module').should('have.value', 'permissions')
        cy.contains('button', 'Cancel').click()
      })
    cy.get('.ant-drawer-content').should('not.exist')
  })

  it('validates the add-permission form', () => {
    cy.visit('/permissions')
    cy.contains('button', 'Add Permission').click()
    cy.contains('.ant-drawer', 'Add New Permission')
      .should('be.visible')
      .within(() => {
        // force: this is the wide (size="large") drawer, and a floating app
        // widget overlaps the footer button's hit area.
        cy.contains('button', 'Create Permission').click({ force: true })
        cy.contains('Select a module').should('exist')
        cy.contains('Select an action').should('exist')
      })
  })

  it('creates a permission from a module + action', () => {
    // Clear any orphan from a prior run (raw delete + Spatie cache reset), so the
    // unique-name create can't collide.
    cy.task('db:deletePermissionByName', TEST_PERMISSION)
    cy.visit('/permissions')
    cy.contains('button', 'Add Permission').click()
    const drawer = () => cy.contains('.ant-drawer', 'Add New Permission')
    drawer().should('be.visible')

    // Open each Select by clicking its box (antd v6 names it .ant-select-content,
    // scoped by the placeholder text); options render in a portal outside the
    // drawer as .ant-select-item-option.
    // Module → Attendance.
    drawer().contains('.ant-select', 'Select a module').find('.ant-select-content').click()
    cy.get('.ant-select-dropdown')
      .filter(':visible')
      .contains('.ant-select-item-option', 'Attendance')
      .click()

    // Action → Manage.
    drawer().contains('.ant-select', 'Select action').find('.ant-select-content').click()
    cy.get('.ant-select-dropdown')
      .filter(':visible')
      .contains('.ant-select-item-option', 'Manage')
      .click()

    // Preview reflects the computed name, then submit (force: footer widget overlap).
    drawer().contains('attendance.manage').should('exist')
    drawer().contains('button', 'Create Permission').click({ force: true })

    cy.get('.ant-drawer-content').should('not.exist')
    cy.contains('.ant-notification-notice', 'Permission created', { timeout: 10_000 }).should(
      'exist',
    )

    // Verify persistence over the API (deterministic; avoids the debounced search).
    const app = new URL(Cypress.config('baseUrl') as string)
    cy.request({
      url: `${Cypress.env('apiUrl')}/api/permissions/paginated`,
      qs: { search: TEST_PERMISSION, per_page: 50 },
      headers: { Accept: 'application/json', Origin: app.origin, Referer: `${app.origin}/` },
    }).then((res) => {
      const found = (res.body?.data ?? []).find(
        (p: { name: string }) => p.name === TEST_PERMISSION,
      )
      expect(found, 'created permission returned by API').to.exist
      expect(found.action).to.eq('manage')
      expect(found.module).to.eq('Attendance')
    })
  })
})
