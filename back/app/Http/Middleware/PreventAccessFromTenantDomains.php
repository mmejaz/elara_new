<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Guards central-only endpoints (tenant provisioning) so they cannot be reached
 * from a tenant subdomain. The mirror image of Stancl's
 * PreventAccessFromCentralDomains.
 *
 * Without this, a tenant admin could hit /api/tenants and enumerate or
 * provision tenants belonging to other customers.
 */
class PreventAccessFromTenantDomains
{
    public function handle(Request $request, Closure $next)
    {
        // Checked against the host rather than tenancy()->initialized: Laravel
        // sorts middleware by priority, so this can run before tenancy has been
        // initialized and the flag would still read false on a tenant domain.
        // The host is the same source of truth the initializer uses.
        if (! in_array($request->getHost(), (array) config('tenancy.central_domains'), true)) {
            return ApiResponse::error(
                ResponseMessage::NOT_FOUND,
                null,
                Response::HTTP_NOT_FOUND,
            );
        }

        return $next($request);
    }
}
