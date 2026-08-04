<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Runs INSIDE a freshly-provisioned tenant database (invoked by Stancl's
 * SeedDatabase job on TenantCreated, and by `php artisan tenants:seed`).
 *
 * Everything here writes to the tenant DB, not central: default roles &
 * permissions, the shared module/lookup catalogue, and the tenant's first
 * admin user (from the wizard payload carried on the tenant's `data`).
 */
class TenantDatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Reuse the existing catalogue seeders — they run against the tenant
        // connection because tenancy is initialized while this seeder runs.
        $this->call([
            RolePermissionSeeder::class,
            ModuleSeeder::class,
            GlobalSettingSeeder::class,
            ReferenceDataSeeder::class,
        ]);

        // First admin for this tenant, from the creation wizard.
        $email = tenant('admin_email');

        if ($email) {
            $admin = User::firstOrCreate(
                ['email' => $email],
                [
                    'name'     => tenant('admin_name') ?? 'Administrator',
                    'password' => tenant('admin_password') ?? 'Password1!',
                ],
            );

            // "Admin", not "Super Admin": AppServiceProvider grants Super Admin a
            // Gate::before bypass over every permission check, which is a level
            // of power the central operator should keep. Admin is granted every
            // permission by RolePermissionSeeder + ModuleSeeder, so a tenant
            // owner still reaches everything inside their own workspace.
            $admin->assignRole('Admin');
        }
    }
}
