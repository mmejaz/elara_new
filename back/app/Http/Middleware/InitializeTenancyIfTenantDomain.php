<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;

/**
 * Makes the API routes "universal": the same route definitions serve both the
 * central app and every tenant, decided purely by the request host.
 *
 *   localhost:8000       -> central context (tenant management, super admin)
 *   acme.localhost:8000  -> tenancy initialized for the `acme` tenant
 *
 * Without this, central hosts would throw TenantCouldNotBeIdentified and we'd
 * have to duplicate every module route file into a tenant-only group.
 *
 * Registered ahead of session middleware in bootstrap/app.php so the session
 * (SESSION_DRIVER=database) is read from the tenant's own database rather than
 * central — that is what keeps one tenant's logins out of another's.
 */
class InitializeTenancyIfTenantDomain
{
    public function __construct(private InitializeTenancyByDomain $tenancy) {}

    public function handle(Request $request, Closure $next)
    {
        if ($this->isCentralDomain($request)) {
            return $next($request);
        }

        return $this->tenancy->handle($request, $next);
    }

    private function isCentralDomain(Request $request): bool
    {
        return in_array($request->getHost(), (array) config('tenancy.central_domains'), true);
    }
}
