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

        // Define all permissions
        $permissions = [
            // User management
            'view users', 'create users', 'edit users', 'delete users',

            // Role management
            'view roles', 'create roles', 'edit roles', 'delete roles',

            // Permission management
            'view permissions', 'create permissions', 'edit permissions', 'delete permissions',

            // Student management
            'view students', 'create students', 'edit students', 'delete students',

            // Teacher management
            'view teachers', 'create teachers', 'edit teachers', 'delete teachers',

            // Attendance
            'view attendance', 'create attendance', 'edit attendance', 'delete attendance',

            // Reports
            'view reports', 'export reports',

            // Dashboard
            'view dashboard',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Super Admin — full access (no explicit permissions needed, bypasses all gates)
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin']);

        // Admin — all permissions except managing super admin
        $admin = Role::firstOrCreate(['name' => 'Admin']);
        $admin->syncPermissions(Permission::all());

        // Teacher — limited to attendance, students, reports, dashboard
        $teacher = Role::firstOrCreate(['name' => 'Teacher']);
        $teacher->syncPermissions([
            'view dashboard',
            'view students',
            'view attendance', 'create attendance', 'edit attendance',
            'view reports',
        ]);

        // Student — view only
        $student = Role::firstOrCreate(['name' => 'Student']);
        $student->syncPermissions([
            'view dashboard',
            'view attendance',
            'view reports',
        ]);

        // Parent — view only (their child's data)
        $parent = Role::firstOrCreate(['name' => 'Parent']);
        $parent->syncPermissions([
            'view dashboard',
            'view attendance',
            'view reports',
        ]);

        // Assign Super Admin role to first user
        $user = User::first();
        if ($user) {
            $user->assignRole('Super Admin');
        }
        });

        $this->command->info('Roles and permissions seeded successfully.');
    }
}
