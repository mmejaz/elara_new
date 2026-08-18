<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the CENTRAL database.
     *
     * The central DB only holds cross-tenant master data. Users, roles &
     * permissions, modules and global settings are TENANT-scoped — their tables
     * live in database/migrations/tenant and only exist inside a tenant DB — so
     * they are seeded by TenantDatabaseSeeder (on TenantCreated / tenants:seed),
     * never here. Seeding a User here is what made `migrate:fresh --seed` fail
     * with "Table 'elara.users' doesn't exist".
     *
     * Everything below is idempotent (firstOrCreate keyed on a natural key), so
     * this is safe to re-run on every deploy.
     */
    public function run(): void
    {
        $this->call([
            // The one default Organization. Central master data — created once
            // for the install, not duplicated into every tenant database.
            OrganizationSeeder::class,
            // Starter lookups whose tables also exist centrally.
            DepartmentSeeder::class,
            DesignationSeeder::class,
            LeaveTypeSeeder::class,
            DocumentTypeSeeder::class,
        ]);
    }
}
