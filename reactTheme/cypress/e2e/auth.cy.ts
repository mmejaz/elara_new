/**
 * End-to-end auth flow against the running stack (Vite SPA + Laravel Sanctum).
 *
 * Prerequisites:
 *   - `npm run dev` (frontend, :5173) and the backend (:8000) both up.
 *   - The database seeded, so the central admin from cypress.config.ts env
 *     (adminEmail / adminPassword) exists.
 */
describe('Authentication', () => {
  it('renders the login page', () => {
    cy.visit('/login')
    cy.contains('Welcome Back').should('be.visible')
    cy.get('input[placeholder="Enter your email"]').should('be.visible')
    cy.get('input[placeholder="Enter your password"]').should('be.visible')
  })

  it('redirects an unauthenticated visitor away from a protected route', () => {
    cy.visit('/dashboard')
    cy.location('pathname').should('eq', '/login')
  })

  it('keeps the user on /login and surfaces an error on bad credentials', () => {
    cy.loginByForm('nobody@example.com', 'wrong-password')
    // Either a field-level explain or the top-of-form alert, depending on
    // whether the backend answers 422 (validation) or 401 (auth).
    cy.get('.ant-form-item-explain-error, .ant-alert').should('be.visible')
    cy.location('pathname').should('eq', '/login')
  })

  it('logs in through the form and lands on the dashboard', () => {
    cy.loginByForm()
    cy.location('pathname', { timeout: 10_000 }).should('eq', '/dashboard')
  })

  it('authenticates programmatically and loads a protected page directly', () => {
    cy.login()
    cy.visit('/dashboard')
    cy.location('pathname').should('eq', '/dashboard')
    // AuthGuard resolved GET /api/user, so no bounce back to /login.
    cy.contains(/dashboard/i).should('exist')
  })
})
