#!/usr/bin/env bash
#
# Run the Elara Cypress E2E suite inside the official cypress/included container.
#
# Why a container: the frontend service image is node:20-alpine, and Cypress
# doesn't run on Alpine/musl — so the tests run in cypress/included instead.
# On macOS there's no `--network host`, so the container reaches the
# host-published dev server + API via host.docker.internal. That origin is
# whitelisted in the backend (SANCTUM_STATEFUL_DOMAINS, cors.php, tenancy
# central_domains) and Vite (allowedHosts).
#
# Prerequisites:
#   - The stack is up:      docker compose up -d
#   - The app is migrated:  docker compose exec backend php artisan migrate --seed
#
# Usage:
#   ./cypress-docker.sh                              # run every spec
#   ./cypress-docker.sh --spec cypress/e2e/auth.cy.ts   # one spec
#   ./cypress-docker.sh --spec "cypress/e2e/{auth,permissions}.cy.ts"
#
# Any arguments are passed straight through to `cypress run`.

set -euo pipefail

# Run from the repo root regardless of where the script is invoked from.
cd "$(dirname "$0")"

CY_VERSION="15.20.0"

# The specs clean their own DB artifacts via cy.task('db:*'), which shell out to
# `docker exec` — unavailable INSIDE the Cypress container, so those tasks no-op
# there. Clear the fixed-name artifacts from the host (where docker works) first,
# so the suite is repeatable. Tenants clean via the API and modules use random
# names, so only the permission spec's fixed name needs this.
echo "Pre-cleaning test artifacts…"
docker compose exec -T backend php artisan tinker --execute="
  \Spatie\Permission\Models\Permission::where('name', 'attendance.manage')->delete();
  \App\Models\Module::where('slug', 'like', 'cyp-%')->forceDelete();
  \Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
" >/dev/null 2>&1 || echo "  (skipped — backend container not reachable)"

docker run --rm \
  --add-host=host.docker.internal:host-gateway \
  -v "$PWD/reactTheme":/e2e \
  -v /e2e/node_modules \
  -w /e2e \
  -e CYPRESS_baseUrl=http://host.docker.internal:5173 \
  -e CYPRESS_apiUrl=http://host.docker.internal:8000 \
  --entrypoint bash \
  "cypress/included:${CY_VERSION}" -c "
    mkdir -p node_modules
    # The project is ESM (\"type\": \"module\"), so the config's \`import from 'cypress'\`
    # needs a local node_modules entry — point it at the image's global install.
    ln -sf /usr/local/lib/node_modules/cypress node_modules/cypress
    # Chrome is more reliable than the bundled Electron here (Electron ignores the
    # GPU launch flags and rendered blank). cypress/included ships Chrome.
    cypress run --browser chrome $*
  "
