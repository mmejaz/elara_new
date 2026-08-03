<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * The session cookie is scoped to the parent domain (.lvh.me) and is therefore
 * sent to every tenant subdomain (stancl/tenancy#653). Storing sessions in the
 * tenant database already makes a session from tenant A unreadable under tenant
 * B — but that protection quietly disappears the day the session driver changes
 * to a shared store (cookie, a shared Redis, …). This middleware is the
 * driver-independent guarantee: a session established under one tenant is never
 * honored under another.
 *
 * Runs after tenancy initialization and after the session has started (appended
 * to the `api` group in bootstrap/app.php). The tenant id is written into the
 * session at login (AuthController@login).
 */
class EnsureUserBelongsToTenant
{
    public function handle(Request $request, Closure $next): Response
    {
        if (tenancy()->initialized && $request->hasSession()) {
            $sessionTenant = $request->session()->get('tenant_id');

            if ($sessionTenant !== null && $sessionTenant !== tenant('id')) {
                auth()->guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                abort(Response::HTTP_UNAUTHORIZED, 'Session does not belong to this tenant.');
            }
        }

        return $next($request);
    }
}
