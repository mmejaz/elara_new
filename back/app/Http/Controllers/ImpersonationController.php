<?php

namespace App\Http\Controllers;

use App\Helpers\ApiResponse;
use App\Models\User;
use App\Services\AuthService;
use Illuminate\Http\Request;
use Lab404\Impersonate\Services\ImpersonateManager;
use Symfony\Component\HttpFoundation\Response;

/**
 * Lets a Super Admin view the app AS another user, then return. Delegates the
 * session/guard mechanics to lab404/laravel-impersonate (which swaps the auth
 * user on the `web` guard and fires Take/Leave events for auditing). The route,
 * response envelope, and `/user` payload are unchanged, so the SPA sees the same
 * API it did before.
 *
 * `start` is Super-Admin-gated at the route; `stop` is auth-only so the
 * impersonated user can always get back.
 */
class ImpersonationController extends Controller
{
    public function __construct(private AuthService $authService) {}

    public function start(Request $request, User $user)
    {
        $actor = $request->user();

        if ($user->is($actor)) {
            return ApiResponse::error('You cannot impersonate yourself.', null, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Defense in depth alongside the route's role:Super Admin gate — take()
        // itself does NOT enforce these hooks, so we check them here.
        if (! $actor->canImpersonate()) {
            return ApiResponse::error('You are not allowed to impersonate users.', null, Response::HTTP_FORBIDDEN);
        }

        if (! $user->canBeImpersonated()) {
            return ApiResponse::error('You cannot impersonate another Super Admin.', null, Response::HTTP_FORBIDDEN);
        }

        // 'web' is the session guard the SPA authenticates against (Sanctum
        // stateful reads it). Impersonating on any other guard wouldn't stick.
        if (! $actor->impersonate($user, 'web')) {
            return ApiResponse::error('Unable to start impersonation.', null, Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return ApiResponse::success(
            $this->authService->currentUser($user->fresh()),
            'Impersonation started.',
        );
    }

    public function stop(Request $request, ImpersonateManager $manager)
    {
        if (! $manager->isImpersonating()) {
            return ApiResponse::error('You are not impersonating anyone.', null, Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $original = $manager->getImpersonator();
        $manager->leave();

        return ApiResponse::success(
            $this->authService->currentUser($original),
            'Returned to your account.',
        );
    }
}
