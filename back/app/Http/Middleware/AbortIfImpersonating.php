<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Helpers\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Lab404\Impersonate\Services\ImpersonateManager;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks a route while the caller is impersonating someone. The package's own
 * ProtectFromImpersonation redirects (302), which an XHR would follow into the
 * wrong response — this returns a clean 403 JSON envelope instead, matching the
 * rest of the API.
 *
 * Applied to identity/credential routes so an impersonator can't change the
 * target user's account or password.
 */
class AbortIfImpersonating
{
    public function __construct(private ImpersonateManager $manager) {}

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->manager->isImpersonating()) {
            return ApiResponse::error(
                'This action is not available while impersonating another user.',
                null,
                Response::HTTP_FORBIDDEN,
            );
        }

        return $next($request);
    }
}
