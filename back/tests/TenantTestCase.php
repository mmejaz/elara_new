<?php

declare(strict_types=1);

namespace Tests;

use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;

/**
 * Base for feature tests that run inside a tenant.
 *
 * The whole app schema lives in database/migrations/tenant, which
 * AppServiceProvider loads for tests, so RefreshDatabase builds it into the
 * single throwaway database. Tenancy bootstrappers are disabled in the testing
 * environment (config/tenancy.php), so resolving a tenant sets the request
 * context without swapping the database connection — everything stays on the
 * one test connection.
 *
 * A default `acme` tenant + domain is registered so requests to APP_URL
 * (http://acme.lvh.me) are identified by the tenancy middleware. Call
 * makeTenant() to add siblings for isolation tests.
 */
abstract class TenantTestCase extends TestCase
{
    use RefreshDatabase;

    protected Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = $this->makeTenant('acme', 'acme.lvh.me');
        tenancy()->initialize($this->tenant);
    }

    /**
     * Create a tenant + domain row without firing the CreateDatabase pipeline
     * (there is no separate tenant database in tests).
     */
    protected function makeTenant(string $id, string $domain): Tenant
    {
        $tenant = Tenant::withoutEvents(
            fn () => Tenant::create(['id' => $id, 'name' => ucfirst($id)])
        );
        $tenant->domains()->create(['domain' => $domain]);

        return $tenant;
    }
}
