<?php

use App\Constants\ResponseMessage;
use App\Helpers\ApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Validation\ValidationException;
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
        $middleware->statefulApi();

        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Spatie permission/role middleware aliases.
        $middleware->alias([
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
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

            return match (true) {
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
        });
    })->create();
