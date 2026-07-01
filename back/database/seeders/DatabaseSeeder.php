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
        User::factory()->create([
            'name' => 'Super Admin',
            'email' => 'test@test.com',
            'password' => bcrypt('password123'),
        ]);

        $this->call(RolePermissionSeeder::class);
        $this->call(ModuleSeeder::class);
    }
}
