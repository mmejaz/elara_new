<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\User;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        DB::transaction(function () {

            // Permissions follow "{module}.{action}" with underscores for spaces.
            $matrix = [
                'users'       => ['view', 'create', 'edit', 'delete'],
                'roles'       => ['view', 'create', 'edit', 'delete'],
                'permissions' => ['view', 'create', 'edit', 'delete'],
                'students'    => ['view', 'create', 'edit', 'delete'],
                'teachers'    => ['view', 'create', 'edit', 'delete'],
                'attendance'  => ['view', 'create', 'edit', 'delete'],
                'reports'     => ['view', 'export'],
                'dashboard'   => ['view'],
            ];

            foreach ($matrix as $module => $actions) {
                foreach ($actions as $action) {
                    Permission::firstOrCreate(['name' => "{$module}.{$action}"]);
                }
            }

            // Super Admin — full access (bypasses all gates).
            Role::firstOrCreate(['name' => 'Super Admin']);

            // Admin — every permission.
            $admin = Role::firstOrCreate(['name' => 'Admin']);
            $admin->syncPermissions(Permission::all());

            // Teacher — attendance, students, reports, dashboard.
            $teacher = Role::firstOrCreate(['name' => 'Teacher']);
            $teacher->syncPermissions([
                'dashboard.view',
                'students.view',
                'attendance.view', 'attendance.create', 'attendance.edit',
                'reports.view',
            ]);

            // Student — view only.
            $student = Role::firstOrCreate(['name' => 'Student']);
            $student->syncPermissions([
                'dashboard.view',
                'attendance.view',
                'reports.view',
            ]);

            // Parent — view only.
            $parent = Role::firstOrCreate(['name' => 'Parent']);
            $parent->syncPermissions([
                'dashboard.view',
                'attendance.view',
                'reports.view',
            ]);

            // Assign Super Admin to the first user — CENTRAL context ONLY.
            // Inside a tenant this seeder runs (via TenantDatabaseSeeder) BEFORE
            // the tenant admin is created, and re-running `tenants:seed` later
            // would otherwise escalate that tenant's admin to Super Admin — which
            // carries the Gate::before bypass. Tenant admins are deliberately
            // "Admin", assigned by TenantDatabaseSeeder.
            if (! tenancy()->initialized) {
                User::first()?->assignRole('Super Admin');
            }
        });

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
