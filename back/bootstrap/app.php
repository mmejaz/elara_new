<?php

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentified;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // Auto-load a route file per module from routes/modules/.
            // The module generator drops "{Module}Api.php" here and it goes
            // live without touching any central file.
            foreach (glob(base_path('routes/modules/*.php')) as $moduleRoutes) {
                Route::middleware('api')
                    ->prefix('api')
                    ->group($moduleRoutes);
            }
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Hardening headers on every response (API + error pages).
        $middleware->append(\App\Http\Middleware\SecurityHeaders::class);

        $middleware->statefulApi();

        // Global ceiling on every /api route (the `login` limiter still applies
        // its stricter per-email/IP limit on top). Uses the `api` limiter
        // registered in AppServiceProvider.
        $middleware->throttleApi();

        // Tenancy must resolve BEFORE Sanctum's stateful group starts the
        // session, so that the session (and the users table behind auth) is
        // read from the tenant database. prependToGroup runs last-prepended
        // first, so this call must come after statefulApi() above.
        $middleware->prependToGroup('api', \App\Http\Middleware\InitializeTenancyIfTenantDomain::class);

        // Same reasoning for the web group: Sanctum's /sanctum/csrf-cookie runs
        // there and starts the database-driven session, which on a tenant domain
        // must be read from the tenant DB (central has no sessions table). On
        // central hosts the middleware is a no-op, so it is safe on both.
        $middleware->prependToGroup('web', \App\Http\Middleware\InitializeTenancyIfTenantDomain::class);

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Spatie permission/role middleware aliases.
        $middleware->alias([
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'central'    => \App\Http\Middleware\PreventAccessFromTenantDomains::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );

        // Normalize every API error into the standard ApiResponse envelope, so
        // framework-thrown exceptions match controller responses one-for-one.
        $exceptions->render(function (\Throwable $e, Request $request) {
            if (! $request->is('api/*')) {
                return null; // let web/other handling proceed
            }

            $response = match (true) {
                $e instanceof ValidationException => ApiResponse::error(
                    ResponseMessage::VALIDATION_FAILED,
                    $e->errors(),
                    Response::HTTP_UNPROCESSABLE_ENTITY,
                ),
                $e instanceof AuthenticationException => ApiResponse::error(
                    ResponseMessage::UNAUTHENTICATED,
                    null,
                    Response::HTTP_UNAUTHORIZED,
                ),
                $e instanceof AuthorizationException,
                $e instanceof \Spatie\Permission\Exceptions\UnauthorizedException => ApiResponse::error(
                    ResponseMessage::UNAUTHORIZED,
                    null,
                    Response::HTTP_FORBIDDEN,
                ),
                $e instanceof \Spatie\Permission\Exceptions\PermissionDoesNotExist => ApiResponse::error(
                    'Permission error',
                    null,
                    Response::HTTP_INTERNAL_SERVER_ERROR,
                ),
                // Rate-limited (e.g. login throttle). Kept out of the default so
                // it isn't mislabeled "Server error" in production; the client
                // reads how long to wait from the Retry-After header preserved
                // below.
                $e instanceof ThrottleRequestsException => ApiResponse::error(
                    ResponseMessage::TOO_MANY_ATTEMPTS,
                    null,
                    Response::HTTP_TOO_MANY_REQUESTS,
                ),
                // Tenant not found (accessing invalid subdomain)
                $e instanceof TenantCouldNotBeIdentified => ApiResponse::error(
                    'Tenant not found',
                    null,
                    Response::HTTP_NOT_FOUND,
                ),
                $e instanceof ModelNotFoundException,
                $e instanceof NotFoundHttpException => ApiResponse::error(
                    ResponseMessage::NOT_FOUND,
                    null,
                    Response::HTTP_NOT_FOUND,
                ),
                default => ApiResponse::error(
                    config('app.debug') ? $e->getMessage() : ResponseMessage::SERVER_ERROR,
                    null,
                    $e instanceof HttpExceptionInterface ? $e->getStatusCode() : Response::HTTP_INTERNAL_SERVER_ERROR,
                ),
            };

            // Carry HTTP-exception headers (Retry-After, X-RateLimit-*, …) onto
            // the envelope — rebuilding the response above would otherwise drop
            // them, leaving a 429 with no "try again in N seconds" signal.
            if ($e instanceof HttpExceptionInterface) {
                $response->headers->add($e->getHeaders());
            }

            return $response;
        });
    })->create();
