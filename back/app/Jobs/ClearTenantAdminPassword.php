<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Final step of the TenantCreated pipeline. The admin_password is only needed by
 * TenantDatabaseSeeder to create the tenant's first admin; once seeding has run
 * it must not linger in plaintext in the central `tenants.data` JSON. This nulls
 * it so a central-DB read (or a leaked backup) can't expose tenant passwords.
 *
 * Runs after SeedDatabase in the pipeline (see TenancyServiceProvider), so the
 * admin already exists by the time the password is cleared.
 */
class ClearTenantAdminPassword implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(protected Tenant $tenant) {}

    public function handle(): void
    {
        // admin_password is a Stancl VIRTUAL attribute (spread onto the model,
        // not reachable via ->data, which reads null). Null the attribute and
        // save — that rewrites the central `data` JSON without the plaintext.
        if ($this->tenant->admin_password !== null) {
            $this->tenant->admin_password = null;
            $this->tenant->save();
        }
    }
}
