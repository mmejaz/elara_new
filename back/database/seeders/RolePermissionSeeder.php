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
                    // Create permissions for both 'web' and 'sanctum' guards
                    Permission::firstOrCreate(['name' => "{$module}.{$action}", 'guard_name' => 'web']);
                    Permission::firstOrCreate(['name' => "{$module}.{$action}", 'guard_name' => 'sanctum']);
                }
            }

            // Super Admin — full access for both 'web' and 'sanctum' guards.
            foreach (['web', 'sanctum'] as $guard) {
                $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => $guard]);
                $superAdmin->syncPermissions(Permission::where('guard_name', $guard)->get());
            }

            // Admin — every permission for both guards.
            foreach (['web', 'sanctum'] as $guard) {
                $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => $guard]);
                $admin->syncPermissions(Permission::where('guard_name', $guard)->get());
            }

            // Create other roles for both guards
            foreach (['web', 'sanctum'] as $guard) {
                // Teacher — attendance, students, reports, dashboard.
                $teacher = Role::firstOrCreate(['name' => 'Teacher', 'guard_name' => $guard]);
                $teacher->syncPermissions(
                    Permission::where('guard_name', $guard)
                        ->whereIn('name', [
                            'dashboard.view',
                            'students.view',
                            'attendance.view', 'attendance.create', 'attendance.edit',
                            'reports.view',
                        ])
                        ->get()
                );

                // Student — view only.
                $student = Role::firstOrCreate(['name' => 'Student', 'guard_name' => $guard]);
                $student->syncPermissions(
                    Permission::where('guard_name', $guard)
                        ->whereIn('name', [
                            'dashboard.view',
                            'attendance.view',
                            'reports.view',
                        ])
                        ->get()
                );

                // Parent — view only.
                $parent = Role::firstOrCreate(['name' => 'Parent', 'guard_name' => $guard]);
                $parent->syncPermissions(
                    Permission::where('guard_name', $guard)
                        ->whereIn('name', [
                            'dashboard.view',
                            'attendance.view',
                            'reports.view',
                        ])
                        ->get()
                );
            }

            // Assign Super Admin to the first user — CENTRAL context ONLY.
            // Inside a tenant this seeder runs (via TenantDatabaseSeeder) BEFORE
            // the tenant admin is created, and re-running `tenants:seed` later
            // would otherwise escalate that tenant's admin to Super Admin — which
            // carries the Gate::before bypass. Tenant admins are deliberately
            // "Admin", assigned by TenantDatabaseSeeder.
            if (! tenancy()->initialized) {
                $user = User::first();
                if ($user) {
                    $user->assignRole(Role::where('name', 'Super Admin')->where('guard_name', 'web')->first());
                }
            }
        });

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
