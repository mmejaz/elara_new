<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Stancl\Tenancy\Jobs\CreateDatabase;
use Stancl\Tenancy\Jobs\MigrateDatabase;
use Stancl\Tenancy\Jobs\SeedDatabase;

/**
 * Provisions ONE default tenant on the `localhost` domain so the SPA at
 * localhost:5173 is usable straight after a fresh install. `localhost` is a
 * tenant domain in this app (the central console lives on 127.0.0.1), so without
 * this the SPA would 500 with "tenant not found" right after migrate:fresh.
 *
 * Idempotent: the tenant row + domain are firstOrCreate'd; the tenant database is
 * (re)provisioned only when needed. Provisioning jobs run SYNCHRONOUSLY
 * (dispatchSync) so the whole thing completes inside `db:seed` — no queue worker
 * required — even though the TenantCreated pipeline is queued in normal operation.
 *
 * Central-only: called from DatabaseSeeder, never from TenantDatabaseSeeder.
 */
class DefaultTenantSeeder extends Seeder
{
    public function run(): void
    {
        $tenant = Tenant::firstOrCreate(
            ['id' => 'local'],
            [
                'name'           => 'Local',
                'status'         => 'active',
                'admin_name'     => env('ADMIN_NAME', 'Super Admin'),
                'admin_email'    => env('ADMIN_EMAIL', 'test@test.com'),
                'admin_password' => env('ADMIN_PASSWORD', 'password123'),
            ],
        );

        $tenant->domains()->firstOrCreate(['domain' => 'localhost']);

        $central = config('tenancy.database.central_connection');
        $dbName  = $tenant->database()->getName();
        // information_schema supports bound parameters (SHOW DATABASES LIKE ? does not).
        $dbExists = (bool) DB::connection($central)->selectOne(
            'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?',
            [$dbName],
        );

        // Fresh central + a leftover tenant DB from a previous install → recreate
        // it clean so schema and data match this install.
        if ($tenant->wasRecentlyCreated && $dbExists) {
            DB::connection($central)->statement("DROP DATABASE IF EXISTS `{$dbName}`");
            $dbExists = false;
        }

        if (! $dbExists) {
            CreateDatabase::dispatchSync($tenant);
            MigrateDatabase::dispatchSync($tenant);
            SeedDatabase::dispatchSync($tenant);
        }
    }
}
