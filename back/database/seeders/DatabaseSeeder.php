<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // First admin. firstOrCreate (keyed on email) makes this safe to re-run
        // on every deploy — no duplicate/unique-constraint failure. Credentials
        // come from env so production never ships the known dev password; the
        // defaults only apply to local. Password is passed plain and hashed by
        // the model's 'hashed' cast. On an existing admin the password is left
        // untouched (firstOrCreate only sets attributes when creating).
        User::firstOrCreate(
            ['email' => env('ADMIN_EMAIL', 'test@test.com')],
            [
                'name'     => env('ADMIN_NAME', 'Super Admin'),
                'password' => env('ADMIN_PASSWORD', 'password123'),
            ],
        );

        // Idempotent — each of these upserts by a natural key (role/permission
        // name, module slug, setting name, organization name), so re-seeding
        // never duplicates.
        $this->call(RolePermissionSeeder::class);
        $this->call(ModuleSeeder::class);
        $this->call(GlobalSettingSeeder::class);
        // The one default Organization. Central master data — seeded here (not in
        // ReferenceDataSeeder) so it is created once for the install and is not
        // duplicated into every tenant database.
        $this->call(OrganizationSeeder::class);
        $this->call(ReferenceDataSeeder::class);
    }
}
