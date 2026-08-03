<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

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

        // The app schema lives in database/migrations/tenant (each tenant owns
        // it). Tests run against a single throwaway database, so load that path
        // too and the full schema is built by RefreshDatabase. Never registered
        // outside tests — central migrate must not create tenant tables.
        if ($this->app->runningUnitTests()) {
            $this->loadMigrationsFrom(database_path('migrations/tenant'));
        }
    }
}
