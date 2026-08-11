import { defineConfig } from 'cypress'
import { execFileSync } from 'node:child_process'

export default defineConfig({
  projectId: 'kzb9jb',
  e2e: {
    // Vite dev server (`npm run dev`). The SPA calls the Laravel API on the
    // matching host at port 8000 (see `env.apiUrl`), so these specs exercise the
    // full stack: React → Sanctum → MySQL.
    baseUrl: 'http://localhost:5173',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // The SPA is a client-rendered redirect app; test-isolation retries handle
    // the occasional first-paint race without inflating timeouts everywhere.
    retries: { runMode: 2, openMode: 0 },
    setupNodeEvents(on, config) {
      on('task', {
        // The Module Builder has no delete endpoint, so a created module can only
        // be removed at the DB level. This hard-deletes test rows (slug LIKE
        // `<prefix>%`, never system modules) directly in the MySQL container. Runs
        // on the host where docker is reachable; in environments without docker
        // (e.g. Cypress-in-container) it degrades to a no-op — specs use unique
        // per-run names, so cleanup failing never breaks a run, it only leaves a
        // stray row. Returns the number of rows deleted, or null if skipped.
        'db:deleteModulesByPrefix'(prefix: string) {
          const safe = String(prefix).replace(/[^a-z0-9_-]/gi, '')
          const sql = `DELETE FROM modules WHERE slug LIKE '${safe}%' AND is_system = 0;`
          try {
            execFileSync(
              'docker',
              ['exec', 'elara_db', 'mysql', '-uroot', '-psecret', 'elara', '-e', sql],
              { stdio: 'pipe' },
            )
            return null
          } catch {
            // docker/mysql not reachable here — skip rather than fail the run.
            return null
          }
        },
        // Permissions also have no delete endpoint. Hard-delete one test
        // permission by exact name (never a wildcard, so it can't touch seeded
        // rows). Same host-docker requirement / graceful no-op as above.
        'db:deletePermissionByName'(name: string) {
          const safe = String(name).replace(/[^a-z0-9._-]/gi, '')
          const sql = `DELETE FROM permissions WHERE name = '${safe}';`
          try {
            execFileSync(
              'docker',
              ['exec', 'elara_db', 'mysql', '-uroot', '-psecret', 'elara', '-e', sql],
              { stdio: 'pipe' },
            )
            // Spatie caches its permission list; a raw DELETE leaves the name in
            // that cache, so the next create throws "already exists". Reset it.
            execFileSync(
              'docker',
              ['exec', 'elara_backend', 'php', 'artisan', 'permission:cache-reset'],
              { stdio: 'pipe' },
            )
            return null
          } catch {
            return null
          }
        },
      })
      return config
    },
  },
  env: {
    // Backend origin, NO /api suffix. cy.login() appends /sanctum/csrf-cookie
    // and /api/login. Override per run with `CYPRESS_apiUrl=…`.
    apiUrl: 'http://localhost:8000',
    // Seeded central admin — DatabaseSeeder's ADMIN_EMAIL / ADMIN_PASSWORD
    // local defaults. Override with `CYPRESS_adminEmail=…` etc.
    adminEmail: 'test@test.com',
    adminPassword: 'password123',
  },
})
