<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Super Admin bypasses every permission / gate check.
        Gate::before(fn ($user, $ability) => $user->hasRole('Super Admin') ? true : null);

        // The Store*/Update* form requests authorize with model-based abilities —
        // e.g. can('create', Department::class), can('update', $department). The
        // app ships no policies, so without this only Super Admin could ever pass
        // and no permissioned role (Admin, etc.) could write anything. Map the
        // ability + model to this app's permission names and let the permission
        // system decide. Prefixes are mostly singular (department.create) but a
        // few are plural (users.create, roles.create), so try both; return null
        // when nothing matches so unrelated gates/policies still run.
        Gate::before(function ($user, string $ability, array $arguments = []) {
            $actions = [
                'viewAny' => 'view', 'view' => 'view',
                'create'  => 'create', 'update' => 'edit', 'delete' => 'delete',
            ];

            if (! isset($actions[$ability]) || empty($arguments)) {
                return null;
            }

            $model = $arguments[0];
            $class = is_object($model) ? $model::class : $model;

            if (! is_string($class) || ! class_exists($class)) {
                return null;
            }

            $base = Str::snake(class_basename($class));

            foreach ([$base, Str::plural($base)] as $prefix) {
                foreach (['web', 'sanctum'] as $guard) {
                    try {
                        if ($user->hasPermissionTo("{$prefix}.{$actions[$ability]}", $guard)) {
                            return true;
                        }
                    } catch (\Spatie\Permission\Exceptions\PermissionDoesNotExist) {
                        // No permission by that name/guard — try the next candidate.
                    }
                }
            }

            return null;
        });

        // One password policy for the whole app. Requests use Password::defaults()
        // so admin-created users, tenant admins, and self-service change all share
        // it. Seeders create users directly (no validation), so seeded/default
        // passwords are unaffected.
        Password::defaults(fn () => Password::min(8)->mixedCase()->numbers()->symbols());

        $this->auditImpersonation();

        // In production, force every generated URL (redirects, signed URLs,
        // assets) to HTTPS so nothing is downgraded behind a TLS-terminating
        // proxy. Skipped locally so http://localhost keeps working.
        if ($this->app->environment('production')) {
            URL::forceScheme('https');
        }

        $this->configureRateLimiters();
    }

    /**
     * Audit trail for impersonation — logs who acted as whom, and when, on both
     * start (TakeImpersonation) and end (LeaveImpersonation).
     */
    private function auditImpersonation(): void
    {
        \Illuminate\Support\Facades\Event::listen(
            \Lab404\Impersonate\Events\TakeImpersonation::class,
            function ($event): void {
                \Illuminate\Support\Facades\Log::info('impersonation.started', [
                    'tenant'          => function_exists('tenant') ? optional(tenant())->id : null,
                    'impersonator_id' => $event->impersonator->getKey(),
                    'impersonator'    => $event->impersonator->email ?? null,
                    'impersonated_id' => $event->impersonated->getKey(),
                    'impersonated'    => $event->impersonated->email ?? null,
                ]);
            },
        );

        \Illuminate\Support\Facades\Event::listen(
            \Lab404\Impersonate\Events\LeaveImpersonation::class,
            function ($event): void {
                \Illuminate\Support\Facades\Log::info('impersonation.ended', [
                    'tenant'          => function_exists('tenant') ? optional(tenant())->id : null,
                    'impersonator_id' => $event->impersonator->getKey(),
                    'impersonated_id' => $event->impersonated->getKey(),
                ]);
            },
        );
    }

    /**
     * Named rate limiters. Applied to routes via the `throttle:<name>` middleware.
     */
    private function configureRateLimiters(): void
    {
        // Brute-force protection for the login endpoint. Two limits apply at once
        // (a request must satisfy both):
        //
        //   - per email+IP: throttles guessing against a single account without
        //     letting an attacker behind a shared IP (NAT/proxy) lock out an
        //     innocent user who happens to sit behind the same address.
        //   - per IP: a wider ceiling that catches credential spraying — many
        //     different emails tried from one IP.
        //
        // The 429 is rendered as JSON through the exception handler in
        // bootstrap/app.php (api/* → ApiResponse envelope).
        RateLimiter::for('login', function (Request $request) {
            $email = Str::lower((string) $request->input('email'));

            return [
                Limit::perMinute(5)->by($email.'|'.$request->ip()),
                Limit::perMinute(20)->by($request->ip()),
            ];
        });

        // Global ceiling for every /api request (applied via throttleApi() in
        // bootstrap/app.php). Keyed per authenticated user, falling back to IP
        // for guests. Generous enough for the SPA's burst on page load, but caps
        // scripted abuse/enumeration of the otherwise-unthrottled endpoints.
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });
    }
}
